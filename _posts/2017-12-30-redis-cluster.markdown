---
layout: post
title: "Deploy redis cluster using bricks"
date:   2017-12-30
author: "@athakwani"
tags: [linux, redis, bricks, cluster]
categories: community
terms: 1
---

This tutorial will show you how to setup a redis cluster using Bricks.

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

## Redis cluster

![Redis Cluster](https://raw.githubusercontent.com/nick-weixx/nick-weixx.github.io/master/img/redis_cluster_1.jpg)

## Dup

First we need to start redis service, type/click the below command:

```.term1
bricks dup -e CLUSTER=yes -e MASTERS=3 -e SLAVES=1 --mount="destination=/var/lib/redis" dupper/redis
```

This will start redis service, with the cluster cofiguration to setup 3 master with 1 slave each.


## Connect 

The next step is to create a redis routing mesh for ports 6379 & 16379, these ports are used for cluster setup. Routing mesh will allow all redis service instances to connect with each other, type/click the below commands:

```.term1
bricks connect 'redis:6379@redis' 'redis:16379@redis'
```

> **Note:** if you encounter `Error response from daemon: rpc error: code = Unknown desc = update out of sequence` error, then try again.

## Scale

Finally, we scale the service the cluster to desired size of 3 master with 1 slave each, type/click the below command.

```.term1
bricks scale redis=6
```

You can check if service is scaled by using bricks ps command as below:

```.term1
bricks ps
```

It should produce below output:

```
ID             IMAGE         COMMAND                  STATUS         NAME
0571441f5dfe   980b2e6acf48  "trafficrouter --r..."   Up 3 seconds   redis.5.oyzrqlsj4q82dosmtkmivg7mi
e53d4f6bd7a6   980b2e6acf48  "trafficrouter --r..."   Up 3 seconds   redis.4.r36218adtisa4ro8485o037km
7ca31f4360dd   980b2e6acf48  "trafficrouter --r..."   Up 3 seconds   redis.6.l6z4aaiovgc3435ekpovn1r49
a98795e254fb   980b2e6acf48  "trafficrouter --r..."   Up 14 seconds  redis.3.9py3tp6dbahxoqng98lfrug8r
c4473311ecdd   980b2e6acf48  "trafficrouter --r..."   Up 20 seconds  redis.2.myh8ft3pcohqxuami5okgg5q6
c41943afbbdd   980b2e6acf48  "trafficrouter --r..."   Up 20 seconds  redis.1.wu9p2ndqk2y2mzlyzskblcr2w
```

## Check the state of replication

The cluster should be setup by now, let's check the status of cluster by connecting to first redis instance.

```.term1
bricks exec -ti $(bricks ps | grep redis.1 | cut -f1 -d' ') redis-cli info
```

You should see below output. This confirms that our cluster is setup. But we still need to verify if it is working properly.
> **Note:** The `# Replication` section should have `connected_slaves:1` & `slave0:ip=127.0.0.4,port=6379,state=online...`. If it doesn't show up, then please wait few more seconds for cluster to self configure and try again.

```
# Server
redis_version:4.0.6
redis_git_sha1:00000000
redis_git_dirty:0
redis_build_id:f1060815dd32471a
redis_mode:cluster
os:Linux 4.4.0-96-generic x86_64
arch_bits:64
multiplexing_api:epoll
atomicvar_api:atomic-builtin
gcc_version:4.9.2
process_id:21
run_id:8b675f933914fdc743c893552b6e97d746491156
tcp_port:6379
uptime_in_seconds:569
uptime_in_days:0
hz:10
lru_clock:4838333
executable:/data/redis-server
config_file:/etc/redis/redis.conf

# Clients
connected_clients:1
client_longest_output_list:0
client_biggest_input_buf:0
blocked_clients:0

# Memory
used_memory:2621320
used_memory_human:2.50M
used_memory_rss:5394432
used_memory_rss_human:5.14M
used_memory_peak:2622344
used_memory_peak_human:2.50M
used_memory_peak_perc:99.96%
used_memory_overhead:2538904
used_memory_startup:1423840
used_memory_dataset:82416
used_memory_dataset_perc:6.88%
total_system_memory:33720020992
total_system_memory_human:31.40G
used_memory_lua:37888
used_memory_lua_human:37.00K
maxmemory:0
maxmemory_human:0B
maxmemory_policy:noeviction
mem_fragmentation_ratio:2.06
mem_allocator:jemalloc-4.0.3
active_defrag_running:0
lazyfree_pending_objects:0

# Persistence
loading:0
rdb_changes_since_last_save:0
rdb_bgsave_in_progress:0
rdb_last_save_time:1514787226
rdb_last_bgsave_status:ok
rdb_last_bgsave_time_sec:0
rdb_current_bgsave_time_sec:-1
rdb_last_cow_size:249856
aof_enabled:1
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_rewrite_time_sec:-1
aof_current_rewrite_time_sec:-1
aof_last_bgrewrite_status:ok
aof_last_write_status:ok
aof_last_cow_size:0
aof_current_size:0
aof_base_size:0
aof_pending_rewrite:0
aof_buffer_length:0
aof_rewrite_buffer_length:0
aof_pending_bio_fsync:0
aof_delayed_fsync:0

# Stats
total_connections_received:17
total_commands_processed:575
instantaneous_ops_per_sec:1
total_net_input_bytes:73847
total_net_output_bytes:68835
instantaneous_input_kbps:0.04
instantaneous_output_kbps:0.00
rejected_connections:0
sync_full:1
sync_partial_ok:0
sync_partial_err:1
expired_keys:0
evicted_keys:0
keyspace_hits:0
keyspace_misses:0
pubsub_channels:0
pubsub_patterns:0
latest_fork_usec:313
migrate_cached_sockets:0
slave_expires_tracked_keys:0
active_defrag_hits:0
active_defrag_misses:0
active_defrag_key_hits:0
active_defrag_key_misses:0

# Replication
role:master
connected_slaves:1
slave0:ip=127.0.0.4,port=6379,state=online,offset=756,lag=0
master_replid:a7507d67a646dfa66fb5848e6d29423cfcd37ee3
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:756
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:756

# CPU
used_cpu_sys:0.48
used_cpu_user:0.20
used_cpu_sys_children:0.00
used_cpu_user_children:0.00

# Cluster
cluster_enabled:1

# Keyspace
```

## Testing cluster

To test if cluster is working, we will write a key value to first master (redis.1) which will redirect to appropriate service based on hash slot. We will then access the same value from third master (redis.3). Run below command to set `bricks=build-any-container-stack` key=value in first master (redis.1):

```.term1
bricks exec -ti $(bricks ps | grep redis.1 | cut -f1 -d' ') bash
redis-cli set bricks build-any-container-stack && redis-cli -c set bricks build-any-container-stack
exit
```

it should produce output like below:

```
(error) MOVED 5919 127.0.0.2:6379
OK
root@7efd5b7b6764:/data# exit
exit
```

Now, let's access the same key from thrid master (redis.3) using below commands:

```.term1
bricks exec -ti $(bricks ps | grep redis.3 | cut -f1 -d' ') bash
redis-cli get bricks && redis-cli -c get bricks
exit
```

it should produce output like below:

```
(error) MOVED 5919 127.0.0.2:6379
"lego-like-microservice"
root@af3ca02ac5db:/data# exit
exit
```

This confirms that out cluster is routing requests to appropriate node.

Congratulations! We successfully configured redis cluster using simple Dup, Connect, and Scale commands. 

You can play around with the setup and test with other key value pairs.