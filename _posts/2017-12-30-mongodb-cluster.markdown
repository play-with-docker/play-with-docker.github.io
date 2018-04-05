---
layout: post
title: "Deploy mongodb cluster using bricks"
date:   2017-12-30
author: "@athakwani"
tags: [linux, mongodb, bricks, cluster]
categories: community
terms: 1
---

This tutorial will show you how to setup a mongodb cluster using Bricks. 

Bricks allow building any container stack without service discovery. Bricks can be compared with Unix Shell. As Shell can pipe processes together to accomplish complex task, Bricks can connect containers together to build complex stacks. 
More details are available in [Github Repo](https://github.com/pipecloud/Bricks)

## Init swarm mode

Click below command to initialize docker swarm mode.

```.term1
docker swarm init --advertise-addr $(hostname -i)
```

This will prepare docker to work with bricks.

## Install bricks

Let's install bricks using below command:

```.term1
curl -sSL https://bricks.pipecloud.co | sh
```

## MongoDB cluster

![MongoDb Cluster](https://linode.com/docs/assets/mongodb-cluster-diagram.png)

## Dup

First we need to start cluster services, type/click the below command:

```.term1
bricks dup --name mongodb --mount="destination=/var/lib/mongodb" dupper/mongodb
bricks dup --name config --mount="destination=/var/lib/mongo-metadata" dupper/mongodb-config
bricks dup --name query dupper/mongodb-query
```

This will start mongodb cluster service.


## Connect

The next step is to connect cluster services together. This will allow cluster service to communicate with each other, type/click the below commands:

> **Note:** if you encounter `Error response from daemon: rpc error: code = Unknown desc = update out of sequence` error, then try again.

```.term1
bricks connect query:27020@config query:27020@mongodb
bricks connect config:27019@config config:27019@query config:27019@mongodb
bricks connect mongodb:27017@mongodb mongodb:27017@query mongodb:27017@config
```

## Scale

Finally, we scale the cluster to desired size, type/click the below command.

```.term1
bricks scale mongodb=3 config=3 query=1
```

You can check if cluster is scaled by using bricks ps command as below:

```.term1
bricks ps
```

It should produce below output:

```
ID             IMAGE         COMMAND                  STATUS               NAME
ce98f60ca7f0   8b7c3ccc7250  "trafficrouter --r..."   Up About a minute    config.3.ndrqvpuii98z10p0ac7nvgqwk
46f662911e9b   8b7c3ccc7250  "trafficrouter --r..."   Up About a minute    config.2.o9q7fp08tws0agd3s9te5vcv7
0a2cb731c012   807affaf5e90  "trafficrouter --r..."   Up About a minute    mongodb.2.k9nm2wupvhol91ik7tttiev5d
59df05668b01   807affaf5e90  "trafficrouter --r..."   Up About a minute    mongodb.3.l37y8mbwees98gcxmcqbihye1
bcba8ab32e91   2e21a3120c10  "trafficrouter --r..."   Up About a minute    query.1.yef8rbilfci1ttd19t942ta5f
6c52cb2d2096   8b7c3ccc7250  "trafficrouter --r..."   Up About a minute    config.1.tikkgwjq8j4qh7zfqh8lcmlh2
56037aadf2ef   807affaf5e90  "trafficrouter --r..."   Up About a minute    mongodb.1.v6g2oi5t1z4ditkn5tl309icj
```

## Check the state of cluster

The cluster should be setup by now, let's check the sharding status on query.1 instance.

```.term1
bricks exec -ti $(bricks ps | grep query.1 | cut -f1 -d' ') bash
mongo 1.localhost:27020 --eval 'sh.status()'
exit
```

You should see below output. This confirms that cluster shards are configured. But we still need to verify if it is working properly.

> **Note:** It takes about a minute for cluster to self configure, if you encounter connection errors, please wait and try again.

> **Note:** The `shards` section should have `{  "_id" : "rs1",  "host" : "rs1/1.localhost:27017,2.localhost:27017",  "state" : 1 }`. If it doesn't show the replica set hosts, then please wait for cluster to self configure and try again.

```
MongoDB shell version v3.4.10
connecting to: localhost:27020
MongoDB server version: 3.4.10
--- Sharding Status ---
  sharding version: {
        "_id" : 1,
        "minCompatibleVersion" : 5,
        "currentVersion" : 6,
        "clusterId" : ObjectId("5a4adee048d79f36876256d4")
  }
  shards:
        {  "_id" : "rs1",  "host" : "rs1/1.localhost:27017,2.localhost:27017",  "state" : 1 }
  active mongoses:
        "3.4.10" : 2
  autosplit:
        Currently enabled: yes
  balancer:
        Currently enabled:  yes
        Currently running:  no
NaN
        Failed balancer rounds in last 5 attempts:  0
        Migration Results for the last 24 hours:
                No recent migrations
  databases:
```

## Testing cluster

To test if cluster is working, we will first insert a document and kill some of the instances and access the data. Run below command to insert `{"name": "bricks", "build": "Any Container Stack"}` document from query service:

```.term1
bricks exec -ti $(bricks ps | grep query.1 | cut -f1 -d' ') bash
mongo 1.localhost:27020 --eval 'db.users.insert({"name": "bricks", "build": "Any Container Stack"});'
exit
```

it should produce below output:
```
MongoDB shell version v3.4.10
connecting to: 1.localhost:27017
MongoDB server version: 3.4.10
WriteResult({ "nInserted" : 1 })
```

Now, let's retrive the document using below command:

```.term1
bricks exec -ti $(bricks ps | grep query.1 | cut -f1 -d' ') bash
mongo 1.localhost:27020 --eval 'db.users.find();'
exit
```

It should produce below output. This confirms our cluster is working properly.

```
MongoDB shell version v3.4.10
connecting to: 1.localhost:27020
MongoDB server version: 3.4.10
{ "_id" : ObjectId("5a4aba2f6ef947d30c880745"), "name" : "bricks", "build" : "Any Container Stack" }
```

## Testing failures

To simulate the failover we should kill some of the cluster services. Below commands will kill primary instance of mongodb shard and 2 config servers, leaving only secondary shard, config service & query server running. 

```.term1
bricks kill $(bricks ps | grep mongodb.1 | cut -f1 -d' ')
bricks kill $(bricks ps | grep config.1 | cut -f1 -d' ')
bricks kill $(bricks ps | grep config.2 | cut -f1 -d' ')
```

We can verify that services are killed using ps command:

```.term1
bricks ps
```

You should not see mongodb.1 config.1, and config.2 instances.
> **Note:** The services self heals, so you have to be quick. If you still see service instances then kill again and run bricks ps immediately.

Now, let's verify if cluster survived failures by retriving the document using below command:

```.term1
bricks exec -ti $(bricks ps | grep query.1 | cut -f1 -d' ') bash
mongo 1.localhost:27020 --eval 'db.users.find();'
exit
```

It should produce below output. This confirms our cluster is working even after loosing half cluster.

```
MongoDB shell version v3.4.10
connecting to: 1.localhost:27020
MongoDB server version: 3.4.10
{ "_id" : ObjectId("5a4aba2f6ef947d30c880745"), "name" : "bricks", "build" : "Any Container Stack" }
```

Congratulations! We successfully configured mongodb cluster using simple Dup, Connect, and Scale commands. 

You can play around with the setup and test by inserting other documents in cluster.