---
layout: post
title:  "Deploy A Cassandra Cluster Docker Stack"
date:   2017-04-03 10:00:00 +0000
author: "Sébastien Allamand (@allamand)"
category: intermediate
tags: [docker, cassandra]
img: cassandra.png
terms: 2
---


## Overview of Cassandra

Cassandra is a NoSQL database which allows a
- decentralized approach : all nodes have the same role (there is no master or slave). Easier configuration
- Linear Scalability: offers the best read/write throughputs for very large clusters
- Fault-Tolerant: data is replicated across datacenters and failed nodes can be replaced without downtime
- Tunable Consistency: a level of consistency can be chosen on a per-query basis.

Cassandra is easy to set up and play with because it has auto-discovery of nodes, and does not need a load-balancer or specific master configuration.

We will see how to set-up a cassandra cluster in this section using [Cassandra Official docker image](https://hub.docker.com/_/cassandra/).

## First we will enable the Swarm mode

> in this tuto wi will only uses a 2 nodes swarm cluster, but it will works exactly the same with more nodes!

```.term1
docker swarm init --advertise-addr=$(hostname -i)
docker swarm join-token manager
```

> Copy the join command to add master output and paste it in the other terminal, to form a 2 node swarm cluster


### show members of swarm

```.term1
docker node ls
```

>If you correctly execute, the above command, you must see 2 nodes


## Create Cassandra Cluster

### We create an attachable network for our stack

We will use a docker overlay network named `cassandra_net` to be the network on which we will plug every cassandra nodes, and every docker that would need to communicate with our cassandra network.

```.term1
docker network create --attachable --driver overlay cassandra_net
```


### Create the first Cassandra Node Docker Compose File

In order to ease or set-up, we will call seed our first cassandra node, and will provide it's ip adresse for next cassandra nodes to add in the cluster.
In fact we can afterward add any new cassandra node using IP adress of any of already existing cassandra nodes, but to ease the process we will always refer to the cassandra-seed one.

```.term1
cat <<EOF > cassandra-seed.yml
version: "3"

services:

 cassandra-seed:
    image: cassandra
    ports:
      - "9042"
    environment:
       CASSANDRA_DC: DC1
       CASSANDRA_CLUSTER_NAME: CWO
       MAX_HEAP_SIZE: "500M"
       HEAP_NEWSIZE: "100M"
    networks:
      - cassandra_net
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 40s

networks:
   cassandra_net:
     external: true

EOF
```


### Launch the Cassandra Seed 

```.term1
docker stack deploy cassandra-seed --compose-file cassandra-seed.yml
```

Cassandra will be listening on port 9042 and the gossip will be done internally (in the `cassandra_net` network) on port 7000


List all your deployed stacks, and view detailed on a specific stack

```.term1
docker stack ls
docker stack ps cassandra-seed 
```

Wait for the node to be "running", it may be in "preparing" while downloading image from docker hub.

> /!\ Warning, don't check the **Desired State** which is already running, and foccus on **Current State**


Check the log

```.term1
docker service logs cassandra-seed_cassandra-seed
```

The last log after initializing the seed would be something like :

```
cassandra-seed_cassandra-seed.1.yxmunvyekzha@node2    | INFO  [OptionalTasks:1] 2017-03-03 08:22:02,039 Cassan
draRoleManager.java:351 - Created default superuser role 'cassandra'
```

### Create Cassandra Node Docker Compose File

This is the docker-compose file from which we will deploy any other cassandra nodes needed in the cluster
```.term1
cat <<EOF > cassandra-node.yml

version: '3'

services:

 cassandra-node:
    image: cassandra
    environment:
      CASSANDRA_SEEDS: "tasks.cassandra-seed"
      CASSANDRA_DC: DFYONE
      CASSANDRA_CLUSTER_NAME: CWO
      MAX_HEAP_SIZE: "500M"
      HEAP_NEWSIZE: "100M"
    networks:
     - cassandra_net

    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 40s
        monitor: 10s
      
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 40s

networks:
   cassandra_net:
     external: true


EOF
```

> Note that by default, Docker Swarm Mode uses the VIP in order to communicate with services, the name `cassandra-seed` is then resolved on the **VIP**.
> This is the problem for cassandra because it need to uses the same adresse it has advertise. for that we will ask to uses the swarm specific name `tasks.cassandra-seed` which will list the ip of containers and not the VIP!!

### Launch the Cassandra Node Stack

```.term1
docker stack deploy cassandra-node --compose-file cassandra-node.yml
```

let's watch the progression of cassandra-node services in the second terminal :
Wait for the node to be "running", it may be in "preparing" while downloading image from docker hub.

```.term2
watch docker stack ps cassandra-node
```

>Please note that the new cassandra will wait 30s to receive datas from the cassandra-seed
>Since we have put replicas:1, swarm will try to start 1 cassandra-node replicas.
>Only one node can register on cassandra at a time, if we scale more, the others will fail several times until all previous nodes are registered.
>This can take several minutes to achieve

Check the log

```.term1
docker service logs cassandra-node_cassandra-node 
```


## Check everything works fine

```.term1
watch docker stack ps cassandra-seed
```
>Ctrl-C to exit the watch mode


You can let the watch on the second terminal for next


## Testing the service

```.term1
docker exec $(docker ps -q --filter name=cassandra-seed) nodetool status
```

We can see that our cluster have 4 nodes “UN” (**Up & Normal**). Our cluster is ready !

### Running the CQL Shell in a Container

Our cluster is running, so let's create a table and insert data using the CQL Shell which comes within Cassandra and we can call it within any of the cluster's container


We could have execute our command in an existing container, but...
```
docker exec -ti $(docker ps -q --filter name=cassandra-node) cqlsh
```


...a better way is to create a new Cassandra container for the sole purpose of executing our CQL Shell. We must plug this container on our `cassandra_net` overlay network.
This way we will note create extra process in our cassandra cluster

```.term1
docker run --rm -ti --network cassandra_net cassandra cqlsh tasks.cassandra-node
```

Once in the CQLShell you can type this examples commands (or only click in the box to copy/paste automatically):

```.term1
CREATE KEYSPACE Test WITH REPLICATION = { 'class' : 'SimpleStrategy', 'replication_factor' : 3 };
CREATE TABLE Test.users (firstname varchar, lastname varchar, info varchar, creation timeuuid, PRIMARY KEY((firstname), creation));
INSERT INTO Test.users (firstname,lastname,info,creation) VALUES ('jean','valjean','el warior', now());
INSERT INTO Test.users (firstname,lastname,info,creation) VALUES ('paul','palovsky','personnel', now());
SELECT * from Test.users;
exit
```

You can exit from this container and create a new one


```.term1
docker run --rm -ti --network cassandra_net cassandra cqlsh tasks.cassandra-node
```

and then in CQLShell test that our data has correctly been stored

```.term1
SELECT * from Test.users;
```

```.term1
SELECT firstname, dateOf(creation), info FROM Test.users WHERE firstname='jean' ORDER BY creation;
exit
``` 


## Scaling Cassandra with care..

This can actually be a small problem when scaling up services because the swarm `update_policy/delay` seams not to be applicated when adding new service (but only for updating existing services)

Uses `--replicas n` to deploy n instances of cassandra nodes

Ask to add 1 more replicas, with instruction `--replicas 2`
```.term1
docker service update -d=false --replicas 2 cassandra-node_cassandra-node
```

>Cassandra has a protection mechanism so that it can't add more node when it is currently adding a new node
>so you may have errors if you scale too fast the service


Check that all nodes are Up and Normal :
```.term1
docker exec $(docker ps -q --filter name=cassandra-seed) nodetool status
```


You can encounter this kind of problem when scaling :
```
cassandra-node_cassandra-node.2.bwvj6o8uzlnq@node2    | Exception (java.lang.RuntimeException) encountered during startup:
node with address /10.0.0.5 already exists, cancelling join. Use cassandra.replace_address if you want to replace this node
cassandra-node_cassandra-node.2.bwvj6o8uzlnq@node2    | java.lang.RuntimeException: A node with address /10.0.0.5 already e
sts, cancelling join. Use cassandra.replace_address if you want to replace this node.
```

## Mounting Data Volume

In our previous example, all cassandra data are stored in the container file system. We should have to export the directory `/data/cassandra` in external storage, ideally using a reliable docker volume plugin and backing storage.


## Free unused ressources

```.term1
docker stack rm cassandra-node
docker stack rm cassandra-seed
```


# WORK IN Progress......


## Monitoring Cassandra with Prometheus

Cassandra is one of many Java-based systems that offers metrics via JMX. The [JMX Exporter](https://github.com/prometheus/jmx_exporter) offers way to use these with [Prometheus](https://prometheus.io/)


We need to add JMX exporter java agent, configuration, and tell Cassandra to use it

```
wget https://repo1.maven.org/maven2/io/prometheus/jmx/jmx_prometheus_javaagent/0.5/jmx_prometheus_javaagent-0.5.jar
wget https://raw.githubusercontent.com/prometheus/jmx_exporter/master/example_configs/cassandra.yml
echo 'JVM_OPTS="$JVM_OPTS -javaagent:'$PWD/jmx_prometheus_javaagent-0.5.jar=7070:$PWD/cassandra.yml'"' >> conf/cassandra-env.sh
```

We need to point cassandra to the JMX metrics endpoint
http://localhost:7070/metrics

Then visit prometheus :
http://localhost:9090/consoles/cassandra.html 


