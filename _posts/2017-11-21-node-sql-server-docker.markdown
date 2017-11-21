---
layout: post
title:  "Node.js with SQL Server on Docker"
date:   2017-11-28
author: "@EltonStoneman"
tags: [beginner, linux, developer, swarm]
categories: beginner
terms: 1
---

This lab walks through the evolution of a simple Node.js bulletin board application, running on Docker. We'll start with a simple app that uses hard-coded data, then add SQL Server for persistent storage, and a proxy to improve web performance.

You'll learn about packaging applications in Docker images, running distributed applications across multiple containers and adding instrumentation to your containers so you can see the health of your application. We'll use Docker Compose and Docker swarm for running the app.

> **Difficulty**: Beginner (assumes no familiarity with Docker)

> **Time**: Approximately 60 minutes

> **Tasks**:
>

> * [Task 0: Prerequisites](#Task_0)
> * [Task 1: Run v1 of the app in a container](#Task_1)
> * [Task 2: Add a SQL Server database container for storage](#Task_2)
> * [Task 3: Switch to high availability in swarm mode](#Task_3)
> * [Task 4: Add a reverse proxy to improve performance](#Task_4)
> * [Task 5: Add monitoring and an application dashboard](#Task_5)

## <a name="task0"></a>Task 0: Prerequisites

You will need:

- a copy of the application source code
- a Docker ID

### Clone the Lab's GitHub Repo

Use the following command to clone the application source code from GitHub (you can click the command or manually type it). This will make a copy of the lab's repo in a new sub-directory called `node-bulletin-board`.

```.term1
git clone https://github.com/dockersamples/node-bulletin-board.git
```

### Save your Docker ID

You need a Docker ID to push your images to Docker Hub. If you don't have one, [create a free Docker ID at Docker Hub](https://hub.docker.com). 

Now save your Docker ID in an environment variable - **you need to type this command manually with your own Docker ID**:

```
export dockerId='your-docker-id'
```

> Be sure to use your own Docker ID. Mine is `sixeyed`, so the command I run is `export dockerId='sixeyed'`.

Check your Docker ID gets displayed when you read the variable:

```.term1
echo $dockerId
```

## <a name="Task_1"></a>Task 1: Run v1 of the app in a container

The first version of the application uses one container to run the Node.js application, and the data is stored in memory.

Switch to the `v1` source code branch:

```.term1
git checkout v1
```

Now build the Docker image, which packages the source code on top of the official Node.js image:

```.term1
docker image build --tag $dockerId/bb-app:v1 --file bulletin-board-app/Dockerfile .
```

When that completes you will have version 1 of the app in an image stored locally. Run a container from that image to start the app:

```.term1
docker container run --detach --publish 8080:8080 $dockerId/bb-app:v1
```

Docker will start a container from the application image, which runs `npm start` to start the app. You can browse to the application on port 8080:

[Click here for v1 of the app](/){:data-term=".term1"}{:data-port="8080"}
