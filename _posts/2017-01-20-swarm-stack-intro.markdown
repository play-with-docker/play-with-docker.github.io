---
layout: post
title: "Swarm stack introduction"
date:   2017-01-20 10:51:47 +0530
author: "@lucj"
tags: [docker, swarm]
categories: docker
img: "swarm.jpg"
terms: 2
---
Let's deploy the voting app stack on a swarm !

## Purpose

The purpose of this lab is to illustrate how to deploy a stack (multi services application) against a Swarm using a docker compose file.

## The application

The voting app is a very handy multi containers application often used for demo purposes during meetup and conferences.

It basically allow users to vote between cat and dog (but could be "space" or "tab" too if you feel like it).

This application is available on Github and updated very frequently when new features are developed.

## Init your swarm

Let's create a Docker Swarm first
```.term1
docker swarm init --advertise-addr $(hostname -i)
```

From the output above, copy the join command (*watch out for newlines*) and paste it in the other terminal.

## show members of swarm

From the first terminal, check the number of nodes in the swarm (running this command from the second terminal will fail as swarm related commands need to be issued against a swarm manager).
```.term1
docker node ls
```

The above command should output 2 nodes, the first one being the manager, and the second one a worker.

## Clone the voting-app

Let's retreive the voting app code from Github and go into the application folder.
```.term1
git clone https://github.com/docker/example-voting-app
cd example-voting-app
```

## Deploy a stack

A stack is a group of service that are deployed together.
The docker-stack.yml in the current folder will be used to deploy the voting app as a stack.
```.term1
docker stack deploy --compose-file=docker-stack.yml voting_stack
```
Node: been able to create a stack from a docker compose file is a great feature added in Docker 1.13.

Check the stack deployed from the first terminal
```.term1
docker stack ls
```

Check the service within the stack
```.term1
docker stack services voting_stack
```

## Conclusion

