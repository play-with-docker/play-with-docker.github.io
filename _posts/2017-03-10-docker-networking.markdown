---
layout: post
title:  "Docker networking"
author: "@lucjuggery"
tags: [docker, labs]
category: intermediate
---

# Understanding container's networking

In this lab, we will study container's networking. We will see the default networks created when installing Docker and attach a container to each one.

We will give a closer look at the default **docker0** bridge network and see how it is map to the network interface of the host.

We will also create a user-defined bridge network and see how this enables the communication between containers through their name.

In the last part we will give some details regarding overlay networks.

During this lab, we will also use several commands of the network API.

## Default networks

Using the network API, let's list the available networks available on your fresh instance.

```.term1
docker network ls
```

This should output something like the following (the ID will not be the same though).

```
NETWORK ID          NAME                DRIVER              SCOPE
c05732ac08ed        bridge              bridge              local
eb1c445f366e        host                host                local
72ebaad33d0e        none                null                local
```

This tells us that 3 networks are avaivable on the host. Let's see the available interfaces on our Linux host.

```.term1
ip a show
```

The output should be similar to the following.

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:c8:84:82:10 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:c8ff:fe84:8210/64 scope link
       valid_lft forever preferred_lft forever
...
```

The important thing to note here is the presence of the **docker0** network interface. This one has been created during the installation of Docker. This interface is linked to the default bridge network listed above.

### Running a container with the default __bridge__ driver

By default, if the **--network** option is not specified, any container ran will be attached to the default bridge 

Let's run a first container based on alpine and name it c1.

```.term1
docker container run -d --name c1 alpine sleep 1000
```

Note: we specified the **sleep 1000** command in order for the container's PID 1 process to remain running for some time.

Once the image is pulled, the ID of the container should be returned. Using this ID, or the name of the container, we will inspect it and extract the networking related information using the Go template notation.

```.term1
docker container inspect -f "{{ "{{ json .NetworkSettings.Networks "}}}}" c1 | python -m json.tool
```

The output tells us to which **NetworkID** the container is attached to, and we can see this one is the same as the ID of the bridge network returned by the **docker network ls** command. On top of this we are returned the IP Address of the container and the gateway used.

```
{
    "bridge": {
        "Aliases": null,
        "EndpointID": "7986fa5a81b0d863760c88cbe0eab082b3d2d38f3ca5e3c2e5923434f7e4f12f",
        "Gateway": "172.17.0.1",
        "GlobalIPv6Address": "",
        "GlobalIPv6PrefixLen": 0,
        "IPAMConfig": null,
        "IPAddress": "172.17.0.2",
        "IPPrefixLen": 16,
        "IPv6Gateway": "",
        "Links": null,
        "MacAddress": "02:42:ac:11:00:02",
        "NetworkID": "c05732ac08edcf6cfa699339ebe7320bfb140a6f2edc0b10ae7681d243cf19e5"
    }
}
```

We can also process the other way round and inspect the bridge network and extract the **.Containers** section:

```.term1
docker network inspect -f "{{ "{{ json .Containers "}}}}" bridge | python -m json.tool
```

We should see the **c1** container listed there.

```
{
    "b6904da3810ddd3f56b4f563e7c85c331e87811d9e7af24df6ffc7b2d970f75d": {
        "EndpointID": "7986fa5a81b0d863760c88cbe0eab082b3d2d38f3ca5e3c2e5923434f7e4f12f",
        "IPv4Address": "172.17.0.2/16",
        "IPv6Address": "",
        "MacAddress": "02:42:ac:11:00:02",
        "Name": "c1"
    }
}
```

### Running a container using the __host__ driver

First list the network stack of the host.

```.term1
ip link show
```

Let's now run an interactive shell within a new alpine based container. We will specify the **--network=host** option to use the network stack of the host on which this container is running.

```.term1
docker container run -ti --network host alpine sh
```

Once inside the container, we list the network interfaces and get the same output as the previous one. The container is thus using the host network stack.

```.term1
ip link show
```

Let's exit the container.

```.term1
exit
```

### Running a container using the __none__ driver

Let's run an interactive shell within a new alpine based container. We will specify the **--network=none** option to remove external connectivity from this container.

```.term1
docker container run -ti --network none alpine sh
```

Once inside this container, we will check the network interfaces available.

```.term1
ip a show
```

This should return an output like the following that shows only the localhost interface is available.

```
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
```

Thus, there is obviously no way to ping the internet from here as shows the error the following commands outputs.

```.term1
ping 8.8.8.8
```

Let's exit the container.

```.term1
exit
```

## Communication between containers attached to bridge0

Let's run a container, still based on alpine, in background. This container will be attached to the default bridge network. We also provide the **sleep 10000** command to make sure the PID 1 process remains running.

```.term1
docker container run -d --name co1 alpine sleep 10000
```

Retrieve the IP of this container with the following command.

```.term1
docker container inspect -f "{{ "{{ .NetworkSettings.IPAddress "}}}}" co1
```

The output should be something like the following. The IP might not be the same though.

```
172.17.0.2
```

Let's run another container in interactive mode.

```.term1
docker container run -ti alpine sh
```

From within this container, ping **co1** from it's ip

```
ping -c 3 IP
```

Still from within this container, ping **co1** using its name.

```.term1
ping -c 3 co1
```

We should have an error message from this last ping as the current container cannot resolve **co1** by its name.

```
ping: bad address 'co1'
```

Let's exit from this container.

```.term1
exit
```

## Communication between containers attached to a user defined bridge network

We will first start by creating a new bridge network (it will fall in the **user-defined** bridge network category then) and name it **bnet**.

```.term1
docker network create --driver bridge bnet
```

Note: we specify **--driver bridge** but this is not needed as bridge is the default driver.

We run a container in background and name it c1 and attach it to the **bnet** we have created.

```.term1
docker container run -d --name cb1 --network bnet alpine sleep 10000
```

We then get the IP of cb1 using the inspect command.

```.term1
docker container inspect -f "{{ "{{ json .NetworkSettings "}}}}" cb1 | python -m json.tool
```

From another container, also attached to the **bnet** network, we will check how we can adress **cb1**.

```.term1
docker container run -ti --network bnet alpine sh
```

Ping cb1 from it's IP

```
ping -c 3 IP
```

Ping cb1 from it's name

```.term1
ping -c 3 cb1
```

In the case of a user-defined bridge network we can that the containers can be addressed by their name as well.

Let's exit the container.

```.term1
exit
```

## Overlay network

Whereas a bridge network provides conectivity between containers that are on the same host, an overlay network enables connectivity between containers across hosts.

There are several possibilities to create a cluster of Docker hosts:
- setup several Docker engines that communicate through a key value store (like Consul, Etcd or Zookeeper). Some additional options need to be provided to each Docker daemon so it targets the KV store
- using a Docker Swarm, which is the recommended approach

An overlay network is created the same way as a user defined **bridge** network but uses the **overlay** driver instead.

```
docker network create --driver overlay onet
```

Once created, an overlay network will spread on the entire cluster, and we will be able to attach containers to this network the same way we have done for **user-defined** bridge network.

The following command shows an example of the creation of a container that is attached to the overlay network.

```
docker container run -ti --network onet alpine sh
```

The concept of overlay network will be illustrated in a future lab in which we will use Docker Machine to create a cluster of Docker hosts.
