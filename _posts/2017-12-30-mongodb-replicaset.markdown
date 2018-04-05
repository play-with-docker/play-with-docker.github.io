---
layout: post
title: "Deploy mongodb replica set using bricks"
date:   2017-12-30
author: "@athakwani"
tags: [linux, mongodb, bricks, replication]
categories: community
terms: 1
---

This tutorial will show you how to setup a mongodb replica set using Bricks.

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

## MongoDB replica set

![MongoDB Replica Set](https://linode.com/docs/assets/mongodb-replication-diagram.png)

## Dup

First we need to start mongodb service, type/click the below command:

```.term1
bricks dup --name mongodb dupper/mongodb
```

This will start mongodb service as primary member of replica set.


## Connect

The next step is to create a mongodb routing mesh. Port 27017 is default mongodb port used for replication. Routing mesh will allow all mongodb service instances to connect with each other, type/click the below commands:

> **Note:** if you encounter `Error response from daemon: rpc error: code = Unknown desc = update out of sequence` error, then try again.

```.term1
bricks connect 'mongodb:27017@mongodb'
```

## Scale

Finally, we scale the service to form replica set, type/click the below command.

```.term1
bricks scale mongodb=3
```

You can check if service is scaled by using bricks ps command as below:

```.term1
bricks ps
```

It should produce below output:

```
ID             IMAGE         COMMAND                  STATUS        NAME
c06f0a56a26f   456634f4c933  "trafficrouter --r..."   Up 1 second   mongodb.2.hydm36onltwf9cchvsc2rqhjy
9fc047a6e816   456634f4c933  "trafficrouter --r..."   Up 1 second   mongodb.3.fmk2ealtpboow5zbdlw5yyvy9
ceb183bde3fa   456634f4c933  "trafficrouter --r..."   Up 1 second   mongodb.1.ppoibcdk24reev5fupn0kmpw5
```

## Check the state of replica set

The replica set should be setup by now, let's check the status by connecting to mongodb primary instance.

```.term1
bricks exec -ti $(bricks ps | grep mongodb.1 | cut -f1 -d' ') bash
mongo --eval 'rs.status()'
exit
```

You should see below output. This confirms that our replica set is ready. But we still need to verify if it is working properly.
> **Note:** The `members` section should have `1.lcoalhost:27010` as `PRIMARY`, `2.localhost:27017` as `SECONDORY` & `3.localhost:27017` as `ARBITER`. If it doesn't show 3 members, then please wait for services to self configure and try again.

```
MongoDB shell version v3.4.10
connecting to: mongodb://127.0.0.1:27017
MongoDB server version: 3.4.10
{
        "set" : "rs1",
        "date" : ISODate("2018-01-01T22:28:06.502Z"),
        "myState" : 1,
        "term" : NumberLong(1),
        "heartbeatIntervalMillis" : NumberLong(2000),
        "optimes" : {
                "lastCommittedOpTime" : {
                        "ts" : Timestamp(1514845680, 1),
                        "t" : NumberLong(1)
                },
                "appliedOpTime" : {
                        "ts" : Timestamp(1514845680, 1),
                        "t" : NumberLong(1)
                },
                "durableOpTime" : {
                        "ts" : Timestamp(1514845680, 1),
                        "t" : NumberLong(1)
                }
        },
        "members" : [
                {
                        "_id" : 1,
                        "name" : "1.localhost:27017",
                        "health" : 1,
                        "state" : 1,
                        "stateStr" : "PRIMARY",
                        "uptime" : 29,
                        "optime" : {
                                "ts" : Timestamp(1514845680, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2018-01-01T22:28:00Z"),
                        "infoMessage" : "could not find member to sync from",
                        "electionTime" : Timestamp(1514845658, 2),
                        "electionDate" : ISODate("2018-01-01T22:27:38Z"),
                        "configVersion" : 3,
                        "self" : true
                },
                {
                        "_id" : 2,
                        "name" : "3.localhost:27017",
                        "health" : 1,
                        "state" : 7,
                        "stateStr" : "ARBITER",
                        "uptime" : 18,
                        "lastHeartbeat" : ISODate("2018-01-01T22:28:05.222Z"),
                        "lastHeartbeatRecv" : ISODate("2018-01-01T22:28:04.226Z"),
                        "pingMs" : NumberLong(0),
                        "configVersion" : 3
                },
                {
                        "_id" : 3,
                        "name" : "2.localhost:27017",
                        "health" : 1,
                        "state" : 2,
                        "stateStr" : "SECONDARY",
                        "uptime" : 17,
                        "optime" : {
                                "ts" : Timestamp(1514845669, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDurable" : {
                                "ts" : Timestamp(1514845669, 1),
                                "t" : NumberLong(1)
                        },
                        "optimeDate" : ISODate("2018-01-01T22:27:49Z"),
                        "optimeDurableDate" : ISODate("2018-01-01T22:27:49Z"),
                        "lastHeartbeat" : ISODate("2018-01-01T22:28:05.221Z"),
                        "lastHeartbeatRecv" : ISODate("2018-01-01T22:28:04.273Z"),
                        "pingMs" : NumberLong(1),
                        "configVersion" : 3
                }
        ],
        "ok" : 1
}
```

## Testing replica set

To test if replica set is working, we will first insert a document to primary instance and access it from secondary instances. Run below command to insert `{"name": "bricks", "build": "Any Container Stack"}` document in primary:

```.term1
bricks exec -ti $(bricks ps | grep mongodb.1 | cut -f1 -d' ') bash
mongo 1.localhost:27017 --eval 'db.users.insert({"name": "bricks", "build": "Any Container Stack"});'
exit
```

it should produce below output:
```
MongoDB shell version v3.4.10
connecting to: 1.localhost:27017
MongoDB server version: 3.4.10
WriteResult({ "nInserted" : 1 })
```

Now, let's verify if document is synced with secondary using below command:

```.term1
bricks exec -ti $(bricks ps | grep mongodb.2 | cut -f1 -d' ') bash
mongo 2.localhost:27017 --eval 'rs.slaveOk(); db.users.find();'
exit
```

It should produce below output. This confirms our replica set is working properly.

```
MongoDB shell version v3.4.10
connecting to: 2.localhost:27017
MongoDB server version: 3.4.10
{ "_id" : ObjectId("5a4aba2f6ef947d30c880745"), "name" : "bricks", "build" : "Any Container Stack" }
```

Congratulations! We successfully configured mongodb replica set using simple Dup, Connect, and Scale commands. 

You can play around with the setup and test by inserting other documents in replica set.