---
layout: post
title: "Service Discovery under Docker Swarm Mode"
date:   2017-04-12
author: "@ajeetsraina"
tags: [linux,operations]
categories: intermediate
img: "swarm-service-discovery.png"
terms: 2
---
Service Discovery under Swarm Mode.

## Purpose

The purpose of this lab is to illustrate how Service Discovery works under Swarm Mode.

## The application

WordPress is an open-source content management system (CMS) based on PHP and MySQL. 
It is a very simple containers application often used for demo purposes during meetup and conferences.


## Init your swarm

Let's create a Docker Swarm first. Open up the first instance and initiate Swarm mode cluster.

```.term1
docker swarm init --listen-addr `hostname -i`:2377
```

This node becomes a master node. The output displays a command to add a worker node to this swarm as shown below:

```
To add a worker to this swarm, run the following command:

    docker swarm join \
    --token <token-id> \
    10.0.37.3:2377
```    


From the output above, copy the join command (*watch out for newlines*), add the new instance and paste the command.This should join the new node to the swarm mode and it becomes a worker node.

## Show members of swarm

Type the below command in the first terminal:

```.term1
docker node ls
```

The output shows you both the manager and worker node indicating 2-node cluster:

```
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGER STATUS
sxn3hrguu3n41bdt9srhqbnva *  node1     Ready   Active        Leader
xsuyuqj2v254dy09t00w8we0t    node2     Ready   Active
```


If you try to execute an administrative command in a non-leader node `worker`, you'll get an error. Try it here:

```.term2
docker node ls
```

## Create an overlay network

```.term1
docker network create -d overlay net1
```

### List out the newly created overlay network using the below command: 


```.term1
docker network ls
```
The output should show the newly added network called "net1" holding swarm scope .

```
NETWORK ID          NAME                DRIVER              SCOPE
f35f0f62b82f        bridge              bridge              local
489b8399dbb6        docker_gwbridge     bridge              local
c3fc0f9aa474        host                host                local
u2q7yajhdfoo        ingress             overlay             swarm
dqczrsdaig1h        net1                overlay             swarm
88614c7df9c8        none                null                local
```


### Creating MYSQL service

```.term1
docker service create \
           --replicas 1 \
           --name wordpressdb \
           --network net1 \
           --env MYSQL_ROOT_PASSWORD=mysql123 \
           --env MYSQL_DATABASE=wordpress \
          mysql:latest
```

The above command creates a service named "wordpressdb" which belongs to "net1" network which runs a single replica of the container.

Run the below command to list out the service:

```.term1
docker service ls 
```


The output should be like the following one (your ID should be different though).

```
ID            NAME                     MODE        REPLICAS  IMAGE
docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE
obuppwh76qfn        wordpressdb         replicated          1/1                 mysql:latest
```

Let's list the tasks of the wordpressdb service.

```.term1
docker service ps wordpressdb
```

You should get an output like the following one where the 1 task  of the service are listed.

```
ID                  NAME                IMAGE               NODE                DESIRED STATE
      CURRENT STATE           ERROR               PORTS
wnhlu88p4ipn        wordpressdb.1       mysql:latest        node2               Running
      Running 5 minutes ago
```


## Creating WordPress service


```.term1
docker service create \
           --env WORDPRESS_DB_HOST=wordpressdb \
           --env WORDPRESS_DB_PASSWORD=mysql123 \
           --network net1 \
           --replicas 4 \
           --name wordpressapp \
           --publish 80:80/tcp 
           wordpress:latest
```

The above command creates a service named "wordpressapp" which belongs to "net1" network which runs 4 copies of wordpressapp container.

Listing out the services:

```.term1
docker service ls
```

Output:

```
ID                  NAME                MODE                REPLICAS            IMAGE
bawmqm2hymnq        wordpressapp        replicated          4/4                 wordpress:late
st
obuppwh76qfn        wordpressdb         replicated          1/1                 mysql:latest
```

You can list the tasks of the wordpressapp service using the command:

```.term1
$ docker service ps wordpressapp
```
### Service Discovery

Let us try to discover wordpressdb service from within one of wordpressapp container. Open up the manager node instance and run the below command:

```
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS
           PORTS               NAMES
31b7b029334c        wordpress:latest    "docker-entrypoint..."   10 minutes ago      Up 10 min
utes       80/tcp              wordpressapp.3.xs1tijusm4u6eupxibkn2x2nk
```
There is a wordpressapp task(container) running on the manager node(shown above) while other tasks might be running on worker node/master node. Let us enter into the wordpressapp.3 task(container) and try to reach out to wordpressab service using the service name.

```.term1
docker container exec -it 31b ping wordpressdb
```

The above command should be able to ping wordpressdb and should show the output:

```
PING wordpressdb (10.0.0.2): 56 data bytes
64 bytes from 10.0.0.2: icmp_seq=0 ttl=64 time=0.060 ms
^C--- wordpressdb ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max/stddev = 0.060/0.060/0.060/0.000 ms
```

Voila ! We are able to ping wordpressdb service from container(running wordpresapp task) using the service name.


{:.quiz}
What features are available under Docker Swarm Mode:
- [ ] Service Discovery
- [ ] Routing Mesh
- [ ] Load Balancing
- [ ] Orchestration
- [x] All of the above
