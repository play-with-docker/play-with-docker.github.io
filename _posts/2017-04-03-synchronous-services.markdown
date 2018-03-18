---
layout: post
title:  "Swarm synchronous services"
date:   2017-04-03
author: "@marcosnils"
tags: [linux,operations,swarm,community]
categories: intermediate
image: franela/dind
---

## Synchronous service create and service update 

A nice [PATCH](https://github.com/docker/docker/pull/31144#issuecomment-291354685) has been merged into Docker a few minutes ago that allows
service creations and updated to be executed synchronously. 

>**Note:** If you don't see the progress bars in the terminal on the right, try resizing the pane to make the term bigger.

## Creating a synchronous service

Initialize your swarm

```.term1
docker swarm init --advertise-addr eth1
```

Create a new synchronous serivce using the new `-d` flag


```.term1
docker service create -d=false --name top --replicas 5 busybox top
```

You should an output similar to the following in the terminal:

```
mmsdrpbigre7ls9vp6mhig3vz
overall progress: 5 out of 5 tasks
1/5: running   [==================================================>]
2/5: running   [==================================================>]
3/5: running   [==================================================>]
4/5: running   [==================================================>]
5/5: running   [==================================================>]
verify: Waiting 1 seconds to verify that tasks are stable...
```

As you can see, a nice progress bar will display the status of the overall deployment.

>**Note:** If you press Ctrl+C while the service is being created, it will be sent to background automatically


We'll check how `update` also works with the `--detach` paramter now.

```.term1
docker service update -d=false --force --update-parallelism 0 top
```
