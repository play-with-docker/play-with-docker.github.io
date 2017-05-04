---
layout: post
title:  "WebApps with Traefik LoadBalancing"
date:   2017-03-31 10:51:47 +0530
author: "Sébastien Allamand (@allamand)"
category: intermediate
tags: [docker, webapp]
img: traefik.png
terms: 2
---

### Before anything How to use this course

Please, validate the Google capcha to activate the shell on the right.
Then, you can either copy the commands yourself, or simply click on the grey boxes to automatically copy commands into the terminal.

```.term1
echo 'execute command on node1!!'
```
```.term2
echo 'execute command on node2!!'
```

> Note: This tutorial might use some Docker experimental features. Refer to the [following guide](https://github.com/moby/moby/tree/master/experimental) to see how to enable them if you plan to run it in your local computer.


## Predictive Load-balancing name using Traefik

In this course, we will leverage the power of Docker Swarm Mode, released with Docker 1.13, and the great features of Traefik Proxy. **[Traefik](https://traefik.io/)** is a popular HTTP L7 Proxy written in GO. It can be configured to listen to swarm events, allowing it to dynamically reconfigure itself when you start/stop docker services. It uses docker **service labels** to define the metadata and rules for its dynamically-configured routing rules to send traffic from traefik to real applications (regardless of the host they are within a Docker Swarm Cluster).


### First we will enable the Swarm mode

> In this tutorial, we will only use a 2 node swarm cluster, but it will work exactly the same way with more nodes!

```.term1
docker swarm init --advertise-addr=$(hostname -i)
```

> Copy the join command output and paste it in the other terminal to form a 2 node swarm cluster.


## Show members of the swarm

```.term1
docker node ls
```

If you correctly executed the above command, you should see 2 nodes:

```
$ docker node ls
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
7p167ggf1wi3ox52z8ga2myu6 *  node1     Ready   Active        Leader
og1irjjh2fjtwt7dko7ht0qnq    node2     Ready   Active
```

### Create Traefik LoadBalancer Docker Container

We will start by creating a Docker Compose file named traefik.yml:

> You can click on the grey box to automatically copy the content on the terminal (don't mess with the order of commands ;) )


```.term1
cat <<EOF > traefik.yml
version: "3"

services:
  traefik:
    image: traefik
    command: --web --docker --docker.swarmmode --docker.watch --docker.domain=traefik --logLevel=DEBUG
    ports:
      - "80:80"
      - "8080:8080"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /dev/null:/traefik.toml

    labels:
      - "traefik.enable=false"
    networks:
      - public
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]		                                                   
      restart_policy:
        condition: on-failure
      
networks:
  public:
    driver: overlay
    ipam:
      driver: default
      config:
      - subnet: 10.1.0.0/24

EOF
```

- We are using version 3 of compose file (mandatory for docker stack deploy)
- We are using the traefik image from Docker Hub
- Docker will create an overlay network named **public**, on which will will add each container we want to publish
- We uses constraints to deploy the service on a swarm manager (as it needs to listen to swarm events)


### Launch the Docker Container

```.term1
docker stack deploy traefik --compose-file traefik.yml
```

The Traefik container is configured to listen on ports 80 and 443 for the standard HTTP traffic, but also exposes port 8080 for a web dashboard.

The use of docker socket allows traefik to listen to the Docker Host Daemon events, and reconfigure itself when containers are started/stopped.

> To work with a swarm cluster with TLS security layer, the configuration to launch the Traefik container will be different.


### Check docker networks

```.term1
docker network ls
```

You should see that a network named **traefik_public** has been created.

Later, if we want other containers to be able to be accessible through the traefik load balancer, we will need to **attach them** to this network.

> One container can be attached to several different networks

### See Your Docker Swarm Stack

List all your deployed stacks and view details on a specific stack

```.term1
docker stack ls
docker stack ps traefik
```

### View logs of our Traefik service

```.term1
docker service logs --tail=10 traefik_traefik
```


### See LoadBalancer Dashboard

Traefik has a Web UI, exposed on port 8080, to show its configuration:

- [Link to Traefik Dashboard](/){:data-term=".term1"}{:data-port="8080"}

> For now the dashboard should be empty, since we have not launched any other services



### Deploy our first service and connect it to the Traefik Load Balancer

**Traefik** load balancer is listening to **docker swarm events** events and will auto-reconfigured based on the service's metadata.  That metadata is provided as docker service labels:

#### Configure service with routing based on URL Path

We can set a label to inform traefik to route the traffic according to the target service URI Path using the `traefik.frontend.rule` label:

```.term1
cat <<EOF > http.yml
version: "3"

services:
  http:
    image: emilevauge/whoami
    networks:
      - traefik_public
    deploy:
      replicas: 1
      labels:
        - "traefik.backend=http"
        - "traefik.port=80"
        - "traefik.frontend.rule=PathPrefixStrip:/http/"
        - "traefik.docker.network=traefik_public"

networks:
  traefik_public:
    external: true

EOF
```

> !!Note: Because we are working with Docker Swarm Mode, labels must be set at the **service** level in the **deploy** section, instead of at **container** level!!

#### launch the container


```.term1
docker stack deploy http --compose-file http.yml
```

The http container should have been attached to the **traefik_public** network, which we can verify by inspecting the network:

```.term1
docker network inspect traefik_public
```

If we visit the [Traefik Dashboard](/){:data-term=".term1"}{:data-port="8080"}, we should see the new service.

We can also call the **Traefik API** to retrieve the current configuration from the Load Balancer.

```.term1
curl http://localhost:8080/api/providers
```


#### Request the service

> We have defined that our service will receive the request if an incoming request starts with the path **/http/**. This was done using the traefik **PathPrefixStrip** rule in the service's **traefik.frontend.rule** label

```.term1
curl http://localhost/http/
```

We should see a response that was generated by the service.

You can request the service directly expose on:

- [Link Service HTTP](/http/){:data-term=".term1"}{:data-port="80"}


You can request the logs of the Traefik Load Balancer:

```.term1
docker service logs --tail=10 traefik_traefik
```

You can request the logs of the application

```.term1
docker service logs --tail=10 http_http
```


### Scaling Service

We can use docker swarm to scale the services of our applications: Example, scale our http service to use 5 instances:

```.term1
docker service scale http_http=5
```

We can also make a synchronous service scale with the new [synchronouse service create/update feature](https://github.com/docker/docker/pull/31144)

```.term1
docker service update -d=false --replicas 10 http_http
```

> This shows the progression of the update, nice ;)

Verify that you have 5 instances of the service :

```.term1
docker service ps http_http
```

You can make local calls to the http service and see the loadbalancing:

```.term1
curl http://localhost/http/
```

On every request, the response comes from a different docker container! (see the Hostname: xx value in the response)

You can also see that http service has several backends configured in the [Traefik Dashboard](/){:data-term=".term1"}{:data-port="8080"}


### Understanding the docker network mechanism

We now have 10 instances of our services http which are deployed on both node1 and node2.
- On each node, there are some instances.
- On each node, there is a network called **traefik_public**
- If we inspect the content of the traefik_public network on each node, we will only see containers that belong to that node


On node1:
```.term1
docker network inspect traefik_public | grep http
```

On node2:
```.term2
docker network inspect traefik_public | grep http
```

<!-- this is not the case anymore, i'm not 100% sure why...
> Note also that in the Traefik Dashboard, you'll find only 1 IP.<br>
> This is the IP of the internal VIP for the http service<br>
> Which load balance on different instances of http service!


Use the following command to find out what it the VIP IP of our service :

```.term1
curl http://localhost:8080/api/providers | jq '.docker.backends."backend-http".servers."server-http_http"'
```

-->


## Deploy a Microservice Application

We have now seen how we can leverage Docker labels to dynamically customize our LoadBalancing routing rules, and how docker-compose can be used to create and link services together.

Now let's try to launch a **more complicated** Microservice application.

We will use **Docker's vote** microservice application with custom labels to be used within our traefik loadbalancer.

<img src="https://github.com/allamand/example-voting-app/raw/master/traefik_voting.png" width="600">

The voting application is composed of :

- A Python webapp which lets you vote between two options
- A Redis queue which collects new votes
- A Java worker which consumes votes and stores them in…
- A Postgres database backed by a Docker volume
- A Node.js webapp which shows the results of the voting in real time
 					

### Run voting microservice application

First you need to retrieve the voting-app application 

```.term1
git clone https://github.com/allamand/example-voting-app.git
```

Go to the app's directory 

```.term1
cd example-voting-app
```

and launch the app using the docker-compose file.

```.term1
docker stack deploy cloud -c docker-compose-pwd.yml
```

> This command will build each part of the microservice from sources.
> It may take a little time to get all of the services up & running (time to download images..)
> You can take a coffee break since this may take a little to finish ;)


To monitor the setup state, you can use:

```.term1
docker stack ps cloud
```

> Be careful, the output shows two state columns :

> - **Desired State** which represents the expected state of your swarm
> - **Current State** which is the current state of the container (which may be stuck in Preparing for a moment while downloading the images).

Once all containers are in the **Running** state, you can start test the application.


While the application is working you can take a look at the docker-compose file we are deploying :

```.term1
cat docker-compose-pwd.yml
```

- We create a private network for our application, named `cloud_private`. You can see it with `docker network ls`
- We connect the vote and result services to the public network `traefik_public`, allowing the proxy to send traffic to them
- We updated the **vote** service with a **traefik.frontend.rule** label set to `PathPrefixStrip:/vote`
- We updated the **result** service with a **traefik.frontend.rule** label set to `PathPrefixStrip:/result`
- The **redis**, **worker**, and **db** services are only on the `cloud_private` network and not on the `traefik_public`


Check the **Traefik Dashboard** and will see that two new entries were added (*frontend-PathPrefixStrip-result* & *frontend-PathPrefixStrip-vote*)


#### You can now make your Vote!!

- [Link Service Vote](/vote/){:data-term=".term1"}{:data-port="80"}


#### And See the results of votes

- [Link Service Result](/result/){:data-term=".term1"}{:data-port="80"}


You can see the logs of the services:

```.term1
docker service logs --tail=10 cloud_vote
```

# Free resources

When you are finished with this tutorial, please free the unused resources:

```.term1
docker stack rm cloud
docker stack rm http
docker stack rm traefik
```

# Conclusion

You are now able to deploy any stack on Docker Swarm Mode using docker-compose and Traefik Proxy!


Note:

> Using Traefik, it is generally recommended to use the Host-based routing rules instead of the Path-based Proxification we used in this tutorial.<br>
> We used this because with Play-With-Docker, there is already a Host-based routing proxy in place to target your instances.

To use Host-based Proxification with traefik, update your label to look like:

```
    labels:
      - "traefik.backend=test2"
      - "traefik.port=80"
      - "traefik.frontend.rule=Host:myservice.myhost.com"
```


> Traefik is not yet able to Proxify TCP requests.  You can look at [docker-flow-proxy](/docker-flow-proxy) from @vfarcic for that purpose.
