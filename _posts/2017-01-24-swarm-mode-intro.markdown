---
layout: post
title: "Swarm mode introduction"
date:   2017-01-24
author: "@marcosnils"
tags: [linux,operations, swarm, community]
categories: beginner
img: "swarm.jpg"
terms: 2
---

This tutorial will show you how to setup a swarm and deploy your first services.


## Init your swarm

```.term1
docker swarm init --advertise-addr $(hostname -i)
```

Copy the join command (*watch out for newlines*) output and paste it in the other terminal.


## Show members of swarm

Type the below command in the first terminal:

```.term1
docker node ls
```

That last line will show you a list of all the nodes, something like this:

```
ID                           HOSTNAME  STATUS  AVAILABILITY  MANAGE
R STATUS
kytp4gq5mrvmdbb0qpifdxeiv *  node1     Ready   Active        Leader
lz1j4d6290j8lityk4w0cxls5    node2     Ready   Active
```

If you try to execute an administrative command in a non-leader node `worker`, you'll get an error. Try it here:

```.term2
docker node ls
```

## Creating services


The next step is to create a service and list out the services. This creates a single service called `web` that runs the latest nginx, type the below commands in the first terminal:

```.term1
docker service create -p 80:80 --name web nginx:latest
docker service ls
```

You can check that nginx is running by executing the following command:

```.term1
curl http://localhost:80
```

## Scaling up

We will be performing these actions in the first terminal. Next let's inspect the service:

```.term1
docker service inspect web
```

That's lots of info! Now, let's scale the service:

```.term1
docker service scale web=15
```

Docker has spread the 15 services evenly over all of the nodes

```.term1
docker service ps web
```

## Updating nodes

You can also drain a particular node, that is remove all services from that node. The services will automatically be rescheduled on other nodes.

```.term1
docker node update --availability drain node2
```
```.term1
docker service ps web
```

You can check out the nodes and see that `node2` is still active but drained.

```.term1
docker node ls
```

## Scaling down

You can also scale down the service

```.term1
docker service scale web=10
```

Lets check our service status 

```.term1
docker service ps web
```

Now bring `node2` back online and show it's new availability

```.term1
docker node update --availability active node2
```
```.term1
docker node inspect node2 --pretty
```

{:.quiz}
Which of these can you do with Docker Swarm Mode?
- [x] add a node
- [x] start a service
- [x] end a service
- [x] list all service
- [x] scale up the number of replicas of a service
- [x] take a node out of the swarm
