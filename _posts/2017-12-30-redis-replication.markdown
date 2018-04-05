---
layout: post
title: "Deploy redis master-slave replication using bricks"
date:   2017-12-30
author: "@athakwani"
tags: [linux, redis, bricks, replication]
categories: community
terms: 1
---

This tutorial will show you how to setup a redis master-slave replication using Bricks.

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

## Dup

First we need to start redis service, type/click the below command:

```.term1
bricks dup -e SLAVES=2 --mount="destination=/var/lib/redis" dupper/redis
```

This will start redis service as master.


## Connect 

The next step is to create a redis routing mesh. Port 6379 is default redis port used for replication. Routing mesh will allow all redis service instances to connect with each other, type/click the below commands:

> **Note:** if you encounter `Error response from daemon: rpc error: code = Unknown desc = update out of sequence` error, then try again.

```.term1
bricks connect 'redis:6379@redis'
```

## Scale

Finally, we scale the service to start replication, type/click the below command.

```.term1
bricks scale redis=3
```

You can check if service is scaled by using bricks ps command as below:

```.term1
bricks ps
```

It should produce below output:

```
ID             IMAGE         COMMAND                  STATUS             NAME
fb2f757eca07   6afe2af9681b  "trafficrouter --r..."   Up 36 seconds      redis.2.j9jpfbekva9bzgqlrvkahwdoh
7c889adf2f37   6afe2af9681b  "trafficrouter --r..."   Up 37 seconds      redis.3.liol02faoqrqxr6h5d4s40v5b
35dad32c58ad   6afe2af9681b  "trafficrouter --r..."   Up About a minute  redis.1.0e0gs18oodpebldadh8gabvkk
```

## Check the state of replication

The replication should be setup by now, let's check the status of replication by connecting to redis master instance.

```.term1
bricks exec -ti $(bricks ps | grep redis.1 | cut -f1 -d' ') redis-cli info
```

You should see below output. This confirms that our replication is setup. But we still need to verify if it is working properly.
> **Note:** The `# Replication` section should have `connected_slaves:2`. If it doesn't show 2 nodes, then please wait for services to self configure and try again.

```
# Server
redis_version:4.0.6
redis_git_sha1:00000000
redis_git_dirty:0
redis_build_id:f1060815dd32471a
redis_mode:standalone
os:Linux 4.4.0-96-generic x86_64
arch_bits:64
multiplexing_api:epoll
atomicvar_api:atomic-builtin
gcc_version:4.9.2
process_id:20
run_id:d5c834a79226a328c65737c73612f9ab4dc01893
tcp_port:6379
uptime_in_seconds:122
uptime_in_days:0
hz:10
lru_clock:4816745
executable:/data/redis-server
config_file:/etc/redis/redis.conf

# Clients
connected_clients:1
client_longest_output_list:0
client_biggest_input_buf:0
blocked_clients:0

# Memory
used_memory:1917768
used_memory_human:1.83M
used_memory_rss:10022912
used_memory_rss_human:9.56M
used_memory_peak:1937832
used_memory_peak_human:1.85M
used_memory_peak_perc:98.96%
used_memory_overhead:1897466
used_memory_startup:765544
used_memory_dataset:20302
used_memory_dataset_perc:1.76%
total_system_memory:33720020992
total_system_memory_human:31.40G
used_memory_lua:37888
used_memory_lua_human:37.00K
maxmemory:0
maxmemory_human:0B
maxmemory_policy:noeviction
mem_fragmentation_ratio:5.23
mem_allocator:jemalloc-4.0.3
active_defrag_running:0
lazyfree_pending_objects:0

# Persistence
loading:0
rdb_changes_since_last_save:0
rdb_bgsave_in_progress:0
rdb_last_save_time:1514766077
rdb_last_bgsave_status:ok
rdb_last_bgsave_time_sec:4
rdb_current_bgsave_time_sec:-1
rdb_last_cow_size:6475776
aof_enabled:0
aof_rewrite_in_progress:0
aof_rewrite_scheduled:0
aof_last_rewrite_time_sec:-1
aof_current_rewrite_time_sec:-1
aof_last_bgrewrite_status:ok
aof_last_write_status:ok
aof_last_cow_size:0

# Stats
total_connections_received:3
total_commands_processed:223
instantaneous_ops_per_sec:1
total_net_input_bytes:7733
total_net_output_bytes:10867
instantaneous_input_kbps:0.04
instantaneous_output_kbps:0.00
rejected_connections:0
sync_full:2
sync_partial_ok:0
sync_partial_err:0
expired_keys:0
evicted_keys:0
keyspace_hits:0
keyspace_misses:0
pubsub_channels:0
pubsub_patterns:0
latest_fork_usec:1018
migrate_cached_sockets:0
slave_expires_tracked_keys:0
active_defrag_hits:0
active_defrag_misses:0
active_defrag_key_hits:0
active_defrag_key_misses:0

# Replication
role:master
connected_slaves:2
slave0:ip=127.0.0.3,port=6379,state=online,offset=154,lag=1
slave1:ip=127.0.0.2,port=6379,state=online,offset=154,lag=1
master_replid:e6bb8a8929380c124d31a9919d456d636c93329c
master_replid2:0000000000000000000000000000000000000000
master_repl_offset:154
second_repl_offset:-1
repl_backlog_active:1
repl_backlog_size:1048576
repl_backlog_first_byte_offset:1
repl_backlog_histlen:154

# CPU
used_cpu_sys:0.09
used_cpu_user:0.02
used_cpu_sys_children:0.00
used_cpu_user_children:0.00

# Cluster
cluster_enabled:0

# Keyspace
```

## Testing replication

To test if replication is working, we will first write a key value to master and access it from slave instances. Run below command to set `bricks=build-any-container-stack` key=value in master:

```.term1
bricks exec -ti $(bricks ps | grep redis.1 | cut -f1 -d' ') redis-cli set bricks build-any-container-stack
```

Now, let's verify if bricks key is replicated in both slaves using below command:

```.term1
bricks exec -ti $(bricks ps | grep redis.2 | cut -f1 -d' ') redis-cli get bricks
```

```.term1
bricks exec -ti $(bricks ps | grep redis.3 | cut -f1 -d' ') redis-cli get bricks
```

Both commands should produce below output. This confirms our replication is working properly.

```
"build-any-container-stack"
```

Congratulations! We successfully configured redis replication using simple Dup, Connect, and Scale commands. 

You can play around with the setup and test with other key value pairs.