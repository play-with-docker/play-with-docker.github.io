---
layout: post
title:  "WebApps with Docker Flow Proxy"
date:   2017-04-01 10:51:47 +0530
author: "Sébastien Allamand (@allamand)"
category: community
tags: [docker,operations,community]
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

>Please note that this platform is not secure and you should not store personal datas<br>
>the instance will be removed after few hours



## Predictive Load-balancing name using Docker Flow Proxy

In this course, we will leverage the power of Docker Swarm Mode, released with Docker 1.13, and the great features of vfarcic **[Docker Flow Proxy](http://proxy.dockerflow.com/swarm-mode-stack/)** which provide an easy way to reconfigure proxy every time a new service is deployed, or when a service is scaled. It uses docker **service labels** to define the metadata and rules for its dynamically-configured routing rules to send traffic from the PRoxy to real applications (regardless of the host they are within a Docker Swarm Cluster).

Docker Flow Proxy is composed on two parts :
- [swarm-listener](https://github.com/vfarcic/docker-flow-swarm-listener)
- [Docker Flow: Proxy](https://github.com/vfarcic/docker-flow-proxy)

The purpose of `swarm-listener` is to monitore swarm services (add, remove, scale..) and to send requests to the proxy whenever a service is created or destroyed.
It must be running on a `Swarm Manager` and will queries Docker API in search for newly created services.

It uses docker **service's labels** (`com.df.*`) to define the metadata and rules for dynamically configure routing rules of the Proxy.

### First we will enable the Swarm mode

> In this tutorial, we will only use a 2 node swarm cluster, but it will work exactly the same way with more nodes!

```.term1
docker swarm init --advertise-addr=$(hostname -i)
docker swarm join-token manager
```

> Copy the join command output and paste it in the other terminal to form a 2 node swarm cluster.


## show members of the swarm

```.term1
docker node ls
```

If you correctly execute, the above command, you must see 2 nodes:
```

$ docker node ls
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
7p167ggf1wi3ox52z8ga2myu6 *  node1     Ready   Active        Leader
og1irjjh2fjtwt7dko7ht0qnq    node2     Ready   Active        Reachable
```

### Create Docker Flow Proxy Docker Containers

We will start by creating a Docker Compose file named proxy.yml, which will defines our 2 services `proxy` and `swarm-listener` of our Docker Flow Proxy stack :

>You can Click on the grey box to automatically copy the content on the terminal (don't mess with the order of commands ;) )


```.term1
cat <<EOF > proxy.yml
version: "3"

services:


  proxy:
    image: vfarcic/docker-flow-proxy
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    environment:
      - LISTENER_ADDRESS=swarm-listener
      - MODE=swarm
    networks:
      - public
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure


  swarm-listener:
    image: vfarcic/docker-flow-swarm-listener
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - public
    environment:
      - DF_NOTIFY_CREATE_SERVICE_URL=http://proxy:8080/v1/docker-flow-proxy/reconfigure
      - DF_NOTIFY_REMOVE_SERVICE_URL=http://proxy:8080/v1/docker-flow-proxy/remove
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
- We are using image from vfarcic on docker Hub
- Docker will create an overlay networks named **public**, on which will will add each container we want to publish
- We uses constraints to deploy the swarm-listener service on a swarm manager (as it needs to listen to swarm events)
- We gives the proxy service the address of the swarm-listener
- We gives the swarm-listener 2 API endpoint to reconfigure the Proxy through environment variables.
- `DF_NOTIFY_*` environments variables defines the url of the Proxy API for reconfiguration.


### Launch the Docker Containers

```.term1
docker stack deploy proxy --compose-file proxy.yml
```

The proxy container is configured to listen on port 80 and 443 for the standard HTTP traffic, and will listen privately on the internal network on port 8080 for the reconfiguration API requests.

### Check docker networks

```.term1
docker network ls
```

You should see that a network named **proxy_public** has been created with Driver **overlay**.

Later If we want others containers to be able to be accessible through the proxy load balancer we will need to **attached them** to this network.


### See Your Docker Swarm Stack

List all your deployed stacks, and view detailed on a specific stack

```.term1
docker stack ls
docker stack ps proxy
```

We must have 2 Proxy Running and 1 swarm-listener Running

> Since we have set 2 replicas for the `proxy` service it will be deployed on both nodes while `swarm-listener` must be on one manager node



### View logs of our Proxy service

```.term1
docker service logs --tail=10 proxy_proxy
```
View logs of our swarm-listener service

```.term1
docker service logs --tail=10 proxy_swarm-listener
```


#### Scaling the Proxy service

Normally, creating a new instance of the proxy service, means that it will starts without any state, as a result, the new instances would not have any knowledge of our already deployed services.
Fortunately docker-flow provides an environment variable `LISTEN_ADDRESS=swarm-listener` which tells the proxy the adress of the `swarm-listener` to resend notifications for all the services. As a result, each proxy instance will soon have the same state as the other :)


### Deploy our first service and connect it to the Docker Flow Proxy


The **swarm-listener** service is listening to **docker swarm events** informations, and will reconfigure the **proxy** service based on the service's metadatas, we need to configure thoses metadata as docker service labels:

#### Configure service with routing based on URL Path

We can set a label to inform the proxy to route the traffic according to the target service URI Path using `com.df.*` rules labels:

```.term1
cat <<EOF > http.yml
version: "3"

services:
  http:
    image: emilevauge/whoami
    networks:
      - proxy_public
    deploy:
      replicas: 3
      labels:
        - com.df.notify=true
        - com.df.distribute=true
        - com.df.servicePath=/http/
        - com.df.reqPathSearch=/http/
        - com.df.reqPathReplace=/renamed/
        - com.df.port=80

networks:
  proxy_public:
    external: true

EOF
```

> !!Note: Because we are working with Docker Swarm Mode, labels must be set at the **service** level in the **deploy** section, instead of at **container** level!!


- The `notify` label ask `swarm-listener` to re-configure `Flow Proxy`
- The `distribute` label means that reconfiguration should be applied to all Proxy instances.

> We are using Docker 1.13 networking features (routing mesh, and VIP) So that Docker takes care of load balancing on all instances of our service, and so that there is no need to reconfigure the proxy every time a new instance is deployed. (We configure our docker's VIP service IP adress in the proxy, so 1 IP per service)


#### launch the container


```.term1
docker stack deploy http --compose-file http.yml
```

The proxy container should have been attached the **proxy_public** network, which we can verify by inspecting the network:

```.term1
docker network inspect proxy_public
```

#### check Service status

```.term1
docker stack ps http
```


#### Request the service

> We have defined that our service will be receive the request if an incoming request starts with the path `/http`. This was done using the rule in the service's `com.df.servicePath=/http` label

We may now be able to reach our service from any host :
from node1
```.term1
curl http://localhost/http/
```
from node2 
```.term2
curl http://localhost/http/
```

We should see a response that was generated by the service. The Url on the service site may have been rewritten (see the `/rewrited/` in the GET parameter)


You can request the service in your Browser:

- [Link to http service](/http/){:data-term=".term1"}{:data-port="80"}


You can request the logs of the Proxy Load Balancer:

```.term2
docker service logs --tail=10 -f proxy_proxy
```

You can request the logs of the application

```.term1
docker service logs --tail=10 http_http
```


### Scaling Service

Swarm is continuously monitoring containers health. If one of them fails, it will redeployed to one of available nodes. If a whole node fails, or if we ask to drain all containers out of a node for maintenance, Swarm will recreate all the containers that were running on that node.
In production we need to reach zero down time, and so to guarentee our nodes will be available, we need to scale our services, so that we have many instances of our service running on severals nodes. That way, while we are waiting for one instance to recuperate from a failure, others can take over the load.

We can use docker swarm to scale the services of our applications: Exemple, scale our http service to use 5 instances:

```.term1
docker service scale http_http=5
```

Check that you have 5 instances of the service :

```.term1
docker service ps http_http
```

You can make local calls to the http service and see the loadbalancing :

```.term1
curl http://localhost/http/
```

On every request, it's a different docker container that will respond!


### Retrieve Proxy Configuration

If we have activated the admin port (8080), then we can request the proxy to retrieve the configuration
Docker Flow Proxy is base on HAProxy so what we retrieve here is the HAProxy configuration

```.term1
curl http://localhost:8080/v1/docker-flow-proxy/config
```


## Deploy a Microservice Application


We have see how we can leverage Docker labels to dynamically customize our LoadBalancing routing rules, and how docker-compose can be used to create and link services together.

Now let's try to launch a **more complicated** Microservice application.

We will uses **Docker's vote** microservice application with custom labels to be used within our Docker Flow Proxy loadbalancer.

<img src="https://github.com/allamand/example-voting-app/raw/master/proxy_voting.png" width="600">

The voting application is composed of :

- A Python webapp which lets you vote between two options
- A Redis queue which collects new votes
- A Java worker which consumes votes and stores them in…
- A Postgres database backed by a Docker volume
- A Node.js webapp which shows the results of the voting in real time
 					

### Run voting microservice application

First you need to Retrieve voting-app application 

```.term1
git clone https://github.com/allamand/example-voting-app.git
```

Go to the stack directory 

```.term1
cd example-voting-app
```

and launch the app using docker-compose file, you can view the **docker-compose-flow-proxy.yml** file

```.term1
docker stack deploy cloud -c docker-compose-flow-proxy.yml
```

> This command will build each part of the microservice from sources.
> It may take a little time to get all services up & running (time to download images..)
> You can take a coffee since this may take a little to finish ;)


#### Rewriting Paths

In this example, we need the incoming requests that starts with `/vote/` or `/result/` to be routed to the according services by the proxy.
But each of our service needs traffic to be send on `/`, so we need the Proxy to **rewrite** the Path while sending the request.

For that we are using specific docker-flow labels `reqPathSearch` and `reqPathReplace`:

```
      labels:
        - com.df.notify=true
        - com.df.distribute=true
        - com.df.servicePath=/vote/
        - com.df.reqPathSearch=/vote/
        - com.df.reqPathReplace=/
        - com.df.port=80

```

To monitor the setup state, you can use:

```.term1
docker stack ps cloud
```

> Be carreful, the Output shows two state columns :

> - **Desired State** which represents what you are asking to swarm
> - **Current State** which is the current state of the container (which may be stuck in Preparing for a moment while downloading the images).

Once all containers are in the **Running** state, you can start test the application.

While the application is working you can take a look at the docker-compose file we are deploying :

```.term1
cat docker-compose-flow-proxy.yml
```

We can view the updated configuration on the proxy API

```.term1
curl http://localhost:8080/v1/docker-flow-proxy/config
```


#### You can now make your Vote!!

- [Link to vote service](/vote/){:data-term=".term1"}{:data-port="80"}


#### And See the results of votes

- [Link to result service](/result/){:data-term=".term1"}{:data-port="80"}

You can see the logs of the services :

```.term1
docker service logs --tail=10 cloud_vote
```


>You are now able to deploy any stack on Docker Swarm Mode using docker-compose and **Docker Flow Proxy**!



## Bonus

We can add a Swarm visualizer service :


```.term1
cat <<EOF > visualizer.yml
version: "3"

services:
  visu:
    image: dockersamples/visualizer
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
    networks:
      - proxy_public
    ports:
      - 81:8080
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]		                                                   
      restart_policy:
        condition: on-failure

networks:
  proxy_public:
    external: true

EOF
```

#### launch the container


```.term1
docker stack deploy visu --compose-file visualizer.yml
```

```.term1
docker service ps visu_visu
```
>wait few second for the service to start

We can now target directly the port 81 of our swarm cluster and docker will direclty reach our Visualizer service

- [Link to Visualizer service](/){:data-term=".term1"}{:data-port="81"}

This should be something like :

![](../images/visualizer.png)


## Free resources

When you are finished with this tutorial, please free the unused resources:

```.term1
docker stack rm cloud
docker stack rm visu
docker stack rm http
docker stack rm proxy
```

