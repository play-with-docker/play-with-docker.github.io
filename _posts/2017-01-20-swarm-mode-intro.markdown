---
layout: post
title: "Swarm mode introduction"
date:   2017-01-20 10:51:47 +0530
author: "@marcosnils"
tags: [docker, swarm]
categories: docker
img: "swarm.jpg"
terms: 2
---

This tutorial will show you how to setup a swarm and deploy your first services.


## Init your swarm

```.term1
docker swarm init --advertise-addr $(hostname -i)
```

Copy the join command (*watch out for newlines*) output and paste it in the other terminal.


## show members of swarm

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

If you try to execute an administrative command in a non-leader node, you'll get an error. Try it here:

```.term2
docker node ls
```

## Creating services


The next step is to create a service and list out the services. This creates a single service called `web` that runs the latest nginx:

```.term1
docker service create -p 80:80 --name web nginx:latest
docker service ls
```

You can check that nginx is running by executing the following comand:

```.term1
curl http://localhost:80
```

## Scaling up

Next let's inspect the service

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
