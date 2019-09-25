---
layout: post
title:  ".NET Conf 2019"
date:   2019-09-04
author: "@EltonStoneman"
tags: [beginner, linux, developer, swarm]
categories: beginner
terms: 1
---

Welcome to Docker's [.NET Conf](https://www.dotnetconf.net) challenge!

This lab gets you using .NET Core in Docker containers. You'll experience compiling code,  packaging apps and running containers, using the latest .NET Core 3.0 release.

> **Difficulty**: Beginner (assumes no familiarity with Docker)

> **Time**: Approximately 5 minutes

> **Tasks**:

> * [Task 1: Grab the code](#Task_1)
> * [Task 2: Build the application image](#Task_2)
> * [Task 3: Run a .NET Core container!](#Task_3)

## <a name="Task_1"></a>Task 1: Grab the code

The Play-with-Docker environment is already set up with Docker and Git, so you're good to go.

### Clone the source code from GitHub

Clone the application source into your local session:

> Just click the text in these boxes to send the command to your terminal

```.term1
git clone https://github.com/dockersamples/dotnetconf19.git
```

Now browse to the source code folder `dotnetconf19`:

```.term1
cd dotnetconf19
```

In there you'll see a folder called `src` which contains the .NET code and a file called `Dockerfile` whch contains the instructions to build and package the app:

```.term1
ls
```

## <a name="Task_2"></a>Task 2: Build the application image

The `Dockerfile` has `dotnet` commands to restore NuGet packages and publish the app:

```.term1
cat Dockerfile
```

> Even if you're not familiar with the [Dockerfile syntax](https://docs.docker.com/engine/reference/builder/), you can kind of work out that this is a script to compile the app and package it up to run

You run the script with the `docker image build` command, which produces a container package called a _Docker image_:

```.term1
docker image build --tag dotnetconf:19 .
```

You'll see lots of download progress bars, and some familiar output from MSBuild.

The final message `Successfully tagged dotnetconf:19` tells you the image has been built and given the tag `dotnetconf:19` - which is just the image name.

## <a name="Task_3"></a>Task 3: Run a .NET Core container!

A Docker image is a complete packaged app. You can share it on [Docker Hub](https://hub.docker.com), which is how thousands of open-source and commercial projects now distribute their software.

Your image contains the .NET Core 3.0 runtime, together with the assemblies and configuration for the demo app.

You run the app by running a container from the image:

```.term1
docker container run dotnetconf:19
```

> Scroll up to read the message from .NET Bot - that's your .NET Conf code!

If you want to learn more about what's happened here and how you can use Docker to build cross-platform apps that run on Windows, Linux, Itenal and Arm - check out this blog post: 

- [Docker + Arm Virtual Meetup Recap: Building Multi-arch Apps with Buildx](https://blog.docker.com/2019/09/docker-arm-virtual-meetup-multi-arch-with-buildx/).

## You're done!

Enjoy .NET Conf :)

The [Play with Docker Training site](http://training.play-with-docker.com) is always on, and there are plenty more labs you can try at home.