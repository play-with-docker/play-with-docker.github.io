---
layout: post
title: "Swarm stack introduction"
date:   2017-01-20 23:35:00 +0100
author: "@lucj"
tags: [docker, swarm]
categories: docker
img: "swarm.jpg"
terms: 2
---

This tutorial will show you how to deploy the voting app stack on a swarm


## Init your swarm

```.term1
docker swarm init --advertise-addr $(hostname -i)
```

Copy the join command (*watch out for newlines*) output and paste it in the other terminal.

## show members of swarm

```.term1
docker node ls
```

The above command should output 2 nodes

## Clone the voting-app

```.term1
git clone https://github.com/docker/example-voting-app
cd example-voting-app
```

## Deploy a stack

A stack is a group of service that are deployed together. The docker-stack.yml in the current folder will be used to deploy the voting app as a stack.

```.term1
docker stack deploy --compose-file=docker-stack.yml voting_stack
```

Check the stack deployed
```.term1
docker stack ls
```

Check the service within the stack
```.term1
docker stack services voting_stack
```
