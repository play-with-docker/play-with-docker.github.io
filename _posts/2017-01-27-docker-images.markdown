---
layout: post
title:  "Docker images deeper dive"
date:   2017-01-27
author: "@lucjuggery"
img: "docker-image.png"
tags: [developer,operations,linux, community]
categories: beginner
---

# Let's have fun with Docker images

In this lab we will see how to create an image from a container. Even if this is not used very often it’s interesting to try it at least once.
Then we will focus on the image creation using a Dockerfile. We will then see how to get the details of an image through the inspection and explore the filesystem to have a better understanding of what happens behind the hood. We will end this lab with the image API.

## Image creation from a container

Let's start by running an interactive shell in a ubuntu container.

```.term1
docker container run -ti ubuntu bash
```

As we've done in the previous lab, we will install the figlet package in this container.

```.term1
apt-get update
apt-get install -y figlet
```

We then exit from this container

```.term1
exit
```

Get the ID of this container using the ls command (do not forget the -a option as the non running container are not returned by the ls command).

```.term1
docker container ls -a
```

Run the following command, using the ID retreived, in order to commit the container and create an image out of it.

```
docker container commit CONTAINER_ID
```

Once it has been commited, we can see the newly created image in the list of available images.

```.term1
docker image ls
```

From the previous command, get the ID of the newly created image and tag it so it's named **ourfiglet**.

```
docker image tag IMAGE_ID ourfiglet
```

Now we will run a container based on the newly created image named **ourfiglet**, and specify the command to be ran such as it uses the figlet package.

```.term1
docker container run ourfiglet figlet hello
```

As figlet is present in our **ourfiglet** image, the command ran returns the following output.

```
 _          _ _
| |__   ___| | | ___
| '_ \ / _ \ | |/ _ \
| | | |  __/ | | (_) |
|_| |_|\___|_|_|\___/

```

This example shows that we can create a container, add all the libraries and binaries in it and then commit this one in order to create an image. We can then use that image as we would do for any other images. This approach is not the recommended one as it is not very portable.

In the following we will see how images are usually created, using a Dockerfile, which is a text file that contains all the instructions to build an image.

## Image creation using a Dockerfile

We will use a simple example in this section and build a hello world application in Node.js. We will start by creating a file in which we retrieve the hostname and display it.

Copy the following content into index.js file.

```
var os = require("os");
var hostname = os.hostname();
console.log("hello from " + hostname);
```

We will dockerrize this application and start by creating a Dockerfile for this purpose. We will use **alpine** as the base image, add a Node.js runtime and then copy our source code. We will also specify the default command to be ran upon container creation.

Create a file named Dockerfile and copy the following content into it.

```
FROM alpine
RUN apk update && apk add nodejs
COPY . /app
WORKDIR /app
CMD ["node","index.js"]
```

Let's build our first image out of this Dockerfile, we will name it hello:v0.1

```.term1
docker image build -t hello:v0.1 .
```

We then create a container to check it is running fine.

```.term1
docker container run hello:v0.1
```

You should then have an output similar to the following one (the ID will be different though).

```
hello from 92d79b6de29f
```

There are always several ways to write a Dockerfile, we can start from a Linux distribution and then install a runtime (as we did above) or use images where this has already been done for us.

To illustrate that, we will now create a new Dockerfile but we will use the **mhart/alpine-node:6.9.4** image. This is not an official image but it's a very well known and used one.

Create a new Dockerfile named Dockerfile-v2 and make sure it has the following content.

```
FROM mhart/alpine-node:6.9.4
COPY . /app
WORKDIR /app
CMD ["node","index.js"]
```

Basically, it is not that different from the previous one, it just uses a base image that embeds alpine and a Node.js runtime so we do not have to install it ourself. In this example, installing Node.js is not a big deal, but it is really helpful to use image where a runtime (or else) is already packages when using more complex environments.

We will now create a new image using this Dockerfile.

```.term1
docker image build -f Dockerfile-v2 -t hello:v0.2 .
```

Note: as we do not use the default name for our Dockerfile, we use the -f option to point towards the one we need to use.

We now run a container from this image.

```.term1
docker container run hello:v0.2
```

Once again, the output will look like the following.

```
hello from 4094ff6bffbd
```

## ENTRYPOINT vs COMMAND

In the 2 previous Dockerfile, we used CMD to define the command to be ran when a container is launched. As we have seen, there are several ways to define the command, using ENTRYPOINT and/or CMD.
We will illustrate this on a new Dockerfile, named Dockerfile-v3, that as the following content.

```
FROM alpine
ENTRYPOINT ["ping"]
CMD ["localhost"]
```

Here, we define the **ping** command as the ENTRYPOINT and the **localhost** as the CMD, the command that will be ran by default is the concatenation of ENTRYPOINT and CMD: **ping localhost**.  This command can be seen as a wrapper around the **ping** utility to which we can change the address we provide as a parameter.

Let's create an image based on this new file.

```.term1
docker image build -f Dockerfile-v3 -t ping:v0.1 .
```

We can run this image without specifying any command:

```.term1
docker container run ping:v0.1
```

That should give a result like the following one.

```
PING localhost (127.0.0.1): 56 data bytes
64 bytes from 127.0.0.1: seq=0 ttl=64 time=0.046 ms
64 bytes from 127.0.0.1: seq=1 ttl=64 time=0.046 ms
64 bytes from 127.0.0.1: seq=2 ttl=64 time=0.046 ms
64 bytes from 127.0.0.1: seq=3 ttl=64 time=0.046 ms
64 bytes from 127.0.0.1: seq=4 ttl=64 time=0.047 ms
```

You can also override the default CMD indicating another IP address. We will use **8.8.8.8** which is the IP of a Google's DNS.

```.term1
docker container run ping:v0.1 8.8.8.8
```

That should return the following.

```
PING 8.8.8.8 (8.8.8.8): 56 data bytes
64 bytes from 8.8.8.8: seq=0 ttl=38 time=9.235 ms
64 bytes from 8.8.8.8: seq=1 ttl=38 time=8.590 ms
64 bytes from 8.8.8.8: seq=2 ttl=38 time=8.585 ms
```

## Image Inspection

As we have already seen with containers, and as we will see with other Docker's components (volume, network, ...), the **inspect** command is available for the image API and it returns all the information of the image provided.

The alpine image should already be present locally, if it's not, run the following command to pull it.

```.term1
docker image pull alpine
```

Once we are sure it is there let's inspect it.

```.term1
docker image inspect alpine
```

There is a lot of information in there:
- the layers the image is composed of
- the driver used to store the layers
- the architecture / os it has been created for
- metadata of the image
- ...

We will not go into all the details now but it's interesing to see an example of the Go template notation that enables to extract the part of information we need in just a simple command.

Let's get the list of layers (only one for alpine)

```.term1
docker image inspect --format "{{ "{{ json .RootFS.Layers "}}}}" alpine | python -m json.tool
```

```
[
    "sha256:60ab55d3379d47c1ba6b6225d59d10e1f52096ee9d5c816e42c635ccc57a5a2b"
]
```

Let's try another example to query only the Architecture information

```.term1
docker image inspect --format "{{ "{{ .Architecture "}}}}" alpine
```

This should return **amd64**.

Feel free to play with the Go template format and get familiar with it as it's really handy.

## Filesystem exploration

We first stop and remove all containers from your host (you might not be able to remove images if containers are using some of the layers).

```.term1
docker container stop $(docker container ls -aq)
docker container rm $(docker container ls -aq)
```

Note: containers can also be removed in a non graceful way:

```
docker container rm -f $(docker container ls -aq)
```

We also remove all the images

```.term1
docker image rm $(docker image ls -q)
```

We will now have a look inside the **/var/lib/docker/overlay2** folder where the image and container layers are stored.

```.term1
ls /var/lib/docker/overlay2
```

As we do not have any images yet, there should not be anything in this folder.

Let's pull an nginx image

```.term1
docker image pull nginx
```

You should get something like the following where we can see that 3 layers are pulled.

```
Using default tag: latest
latest: Pulling from library/nginx
5040bd298390: Pull complete
d7a91cdb22f0: Pull complete
9cac4850e5df: Pull complete
Digest: sha256:33ff28a2763feccc1e1071a97960b7fef714d6e17e2d0ff573b74825d0049303
Status: Downloaded newer image for nginx:latest
```

If we have a look to the changes that occurs in the /var/lib/docker/overlay2 folder

```.term1
ls /var/lib/docker/overlay2
```

we can see the following:

```
261fed39e3aca63326758681c96cad5bfe7eeeabafda23408bee0f5ae365d3fd
28f7998921ca5e4b28231b59b619394ba73571b5127a9c28cc9bacb3db706d2a
backingFsBlockDev
c1ae1be1c1c62dbaacf26bb9a5cde02e30d5364e06a437d0626f31c55af82a58
l
```

Some folders, with names that looks like hash, were created. Those are the layers which, merged together, build the image filesystem.

Let's run a container based on nginx.

```.term1
docker container run -d nginx
```

We can now see 2 additional folders (ID, ID-init), those ones correspond to the read-write layer of the running container.
 
```
11995e6da1dc5acab33aceacea3656d3795a4fb136c3a65b37d40b97747b5f84
11995e6da1dc5acab33aceacea3656d3795a4fb136c3a65b37d40b97747b5f84-init
261fed39e3aca63326758681c96cad5bfe7eeeabafda23408bee0f5ae365d3fd
28f7998921ca5e4b28231b59b619394ba73571b5127a9c28cc9bacb3db706d2a
backingFsBlockDev
c1ae1be1c1c62dbaacf26bb9a5cde02e30d5364e06a437d0626f31c55af82a58
l
```

Feel free to go into those folder and explore their filesystems.
