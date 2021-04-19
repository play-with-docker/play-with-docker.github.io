---
layout: post
title:  "TeamCity on Docker"
date:   2021-4-19
author: "@Chen-Zidi, @Spycsh"
tags: [docker, TeamCity]
categories: intermediate
terms: 1
---


## Introduction

In this scenario, we will focus on how to run TeamCity on the docker container. It includes how to run docker images of teamcity server and agent, how to connect them, and how to build a project using teamcity on docker images. 

This toturial might need a little bit long time, because we need time to pull images from Docker Hub repository.

For preparation, create folders by these commands:

```.term1
mkdir -p teamcity
mkdir teamcity/data
mkdir teamcity/logs
mkdir teamcity/agent
```

## Step 1: Run TeamCity Server in Docker container


The first thing is to set up TeamCity Server. We need to pull the server image from the Docker Hub repository. This might need a few minutes.


```.term1
docker pull jetbrains/teamcity-server
```

We can view the images on the machine using this command:

```.term1
docker images
```
The TeamCity Server should be listed.

Now, we can run this command to start a Docker container with TeamCity Server. 

```.term1
docker run -it -d --name server -u root -v /teamcity/data:/data/teamcity_server/datadir -v /teamcity/logs:/opt/teamcity/logs -p 8111:8111 jetbrains/teamcity-server
```

Here are explanations of the command:
- `-it` : We want an interactive session with a pseudo terminal.
- `-d` : Run in the background. When we use our local machine, we can delete this. In that case, we need two terminals. One additional terminal for an agent.
- `--name server` : We name this container "server". The name can be assigned as you like.
- `-u root` : To run the command under 'root' user. This can be removed in your local machine when you login in as the root user.
- `-v /teamcity/data:/data/teamcity_server/datadir` : We bound /teamcity/data folder in our machine with TeamCity Data Directory. When you execute the command on your own machine, please create or specify your own folder.
- `-v /teamcity/logs:/opt/teamcity/logs` :  We bound /teamcity/logs folder in our machine to store TeamCity logs. When you execute the command on your own machine, please create or specify your own folder.
- `-p 8111:8111` : This is a map of the port between our machine and the container. You can use this command as `-p <host port>:8111`, and specify your own perferred port on your local machine.
- `jetbrains/teamcity-server` : This is the name of the image.

This might also need a few minutes. After execution of the command, we can open [webserver](/){:data-term=".term1"}{:data-port="8111"} to see the page of TeamCity. In your local machine, you can open the browser and access to `localhost:<host port>` to see the page.  

We can use this command to see the running Docker container.

```.term1
docker ps
```

## Step 2: Create a project and build steps in TeamCity

After initialization, we click on proceed to start TeamCity for the first time.

<img src="../images/docker-teamcity-first-start.JPG" style="zoom:50%">

We keep the database type as default.

<img src="../images/docker-teamcity-database-type.JPG" style="zoom:50%">

Then, we accept the license agreement and continue to create administrator account. For this toturial, we enter name `admin` and password `admin`. 

<img src="../images/docker-teamcity-create-account.JPG" style="zoom:50%">


Now, we can add a project and create build steps for it. By clicking on the `create project` button on the main page, we can add a project.

<img src="../images/docker-teamcity-main-page.JPG" style="zoom:50%">

In this toturial, we want to use TeamCity to automatically compile a java file when we build the project. So, we create the project from a repository URL. I use a java hello world program from my github repository: https://github.com/Chen-Zidi/HelloWorld.git. Since it is a public repository, the username and password can be left empty. We just proceed. 

<img src="../images/docker-teamcity-create-project.JPG" style="zoom:70%">



In the next page, we name the configuration as `compile java file`.


<img src="../images/docker-teamcity-name-config.JPG" style="zoom:70%">


We want TeamCity to automatically compile `HelloWorld.java` for us when building the project. So, in the next page for configureing build steps, we click on `configure build steps manually`.

<img src="../images/docker-teamcity-config-manually.JPG" style="zoom:70%">



> **Note:** TeamCity can automatically detect build steps in the project. It supports to detect build steps in Maven，Gradle，Ant，NAnt，MSBuild，Powershell，Xcode，Rake，IntelliJ IDEA and so on.


 We select runner type as `Command Line`. Step name could be `compile`. Custom script could be `javac HelloWorld.java`. 

<img src="../images/docker-teamcity-create-build.JPG" style="zoom:70%">

> **Note:** An interesting thing is that we can even create a docker image for our projects using TeamCity. TeamCity provides support for Docker. Explore yourself if you are interested in it!

Save the step and switch to `General Settings`. Set the artifact path as `./` to output the class file to current directory. Let's save the setting. 

<img src="../images/docker-teamcity-artificate-path.JPG" style="zoom:70%">


## Step 3: Run TeamCity Agent in Docker container


After configuring the project and the build step, we need to create a TeamCity Agent to spawn the build process. 

Run this command to pull TeamCity Minimal Agent Image:
```
docker pull jetbrains/teamcity-minimal-agent
```
> **Note:** This image only provides minimal TeamCity Agent services. It is enough for this small example. Normally, you can use `jetbrains/teamcity-agent` on your own machine.

Then, we can start a Docker container with TeamCity Agent which tries to connect with the TeamCity Server.
```console
docker run -it -d -e SERVER_URL="http://server:8111" --link server -u root -v /teamcity/agent:/teamcity_agent/conf jetbrains/teamcity-agent
```
In this command:
- `-e SERVER_URL="http://server:8111"` : Set the environment variable `SERVER_URL`.
- `--link server` : Add link to the container whose name is `server`.
- `-v /teamcity/agent:/teamcity_agent/conf` : Specify the path of the agent config folder.
- `jetbrains/teamcity-minimal-agent` : This is the name of the image.

## Step 4: Build the project in TeamCity



Back to the dashboard/browser. Click on the `Agents` on the top.  


<img src="../images/docker-teamcity-top-bar.JPG" style="zoom:70%">

There should be one agent in the unauthorized category.

<img src="../images/docker-teamcity-unauthorized-agent.JPG" style="zoom:70%">

Authorize this agent. Then, there should be one connected agent with status idle.

<img src="../images/docker-teamcity-connected-agent.JPG" style="zoom:70%">

Go to the projects page, we can find a `Run|...` button in the `HelloWorld` project. 

<img src="../images/docker-teamcity-project.JPG" style="zoom:70%">

Click on the `...` in `Run|...`, and select the agent which we just created. Click on `Run build`. 

<img src="../images/docker-teamcity-run-config.JPG" style="zoom:70%">

Then, we can see the project starts to build the steps that we just created.


## Step 5: Check output

Under the `Run|...` button, there is an `Artifacts` link. When we place the mouse on it, we can see the list of artifacts. There should be a file `HelloWorld.class`, which means our program has been complied. 

<img src="../images/docker-teamcity-check-result.JPG" style="zoom:70%">

TeamCity can do far more than that. Explore yourself with different possibilities. 

## Conclusion

This toturial focuses on how to dockerize TeamCity Server and Agent, and create a small sample for building a project. 

Thanks for reading! ;)