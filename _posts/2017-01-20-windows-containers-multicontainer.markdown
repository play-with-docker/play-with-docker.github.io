---
layout: post
title:  "Windows Containers Multi-Container Applications"
date:   2017-01-20
author: "@manomarks"
tags: [windows,operations,developer, swarm]
categories: beginner
terms: 0
---

## Multi-Container Applications

This tutorial will walk you through using the sample Music Store application with Windows containers. The Music Store application is a standard .NET sample application, available in the [aspnet GitHub repository](https://github.com/aspnet/MusicStore "Music Store application"). We've [forked it](https://github.com/friism/MusicStore "link to forked version of Music Store App") to use Windows Containers.

## Using docker-compose on Windows
Docker Compose is a great way develop complex multi-container consisting of databases, queues and web frontends.

To develop with Docker Compose on a Windows Server 2016 system, install compose too (this is not required on Windows 10 with Docker for Windows installed):

```
Invoke-WebRequest https://github.com/docker/compose/releases/download/1.11.1/docker-compose-Windows-x86_64.exe -UseBasicParsing -OutFile $env:ProgramFiles\docker\docker-compose.exe
```

To try out Compose on Windows, clone a variant of the ASP.NET Core MVC MusicStore app, backed by a SQL Server Express 2016 database.

```
git clone https://github.com/dockersamples/dotnet-musicstore.git
...
cd dotnet-musicstore
docker-compose -f .\docker-compose.windows.yml build
...
docker-compose -f .\docker-compose.windows.yml up
...
```

To access the running app from the host running the containers (for example when running on Windows 10 or if opening browser on Windows Server 2016 system running Docker engine) use the container IP and port 5000. `localhost` will not work:

```
docker inspect -f {% raw%}{{ .NetworkSettings.IPAddress }}{% endraw %} dotnet-musicstore_web_1
172.21.124.54
```

If using Windows Server 2016 and accessing from outside the VM or host, simply use the VM or host IP and port 5000.

### What's happening here?
Take a closer look at the `docker-compose.windows.yml` file.

```
version: '2.1'
services:
  db:
    image: microsoft/mssql-server-windows-express
    environment:
      sa_password: "Password1"
    ports:
      - "1433:1433" # for debug. Remove this for production

  web:
    build:
      context: .
      dockerfile: Dockerfile.windows
    environment:
      - "Data:DefaultConnection:ConnectionString=Server=db,1433;Database=MusicStore;User Id=sa;Password=Password1;MultipleActiveResultSets=True"
    depends_on:
      - "db"
    ports:
      - "5000:5000"

networks:
  default:
    external:
      name: nat
```

You can find more details in the [Docker Compose documentation](https://docs.docker.com/compose/ "Docker Compose documentation"), but basically here's what is happening.
  - Two services are defined, `db` and `web`.
  - `db` is a Microsoft SQL Express image official image from Microsoft.
    - The password for `db` is set to `Password1` (obviously only for a developer environment).
    - Port 1433 on the host is mapped to the exposed port 1433 in the container which is used for debugging.
  -  `web` is built from `Dockerfile.windows`. 
    - Compose passes along an environment variable which defines where the database is and how to connect to it. Notice that we can just refer to the database as `db` and Compose will allow `web` to discover the service there.
    - The port 5000 is mapped to the exposed port 5000 in the container.
  - The two services are added to an existing Docker network, named `nat`.

Let's look at `Dockerfile.windows` to understand it a bit better.

```
FROM microsoft/dotnet:1.1-sdk-msbuild-nanoserver
```
This pulls in the official microsoft .NET Core image based on Nano Server
```
SHELL ["powershell", "-Command", "$ErrorActionPreference = 'Stop';"]
```
This sets the shell to powershell.
```
RUN set-itemproperty -path 'HKLM:\SYSTEM\CurrentControlSet\Services\Dnscache\Parameters' -Name ServerPriorityTimeLimit -Value 0 -Type DWord
```
This disables the Windows DNS cache. The cache is too aggressive, and turning it off ensures the web container always queries the DNS server running in Docker to get the address of the database container.
```
RUN New-Item -Path \MusicStore\samples\MusicStore.Standalone -Type Directory
WORKDIR MusicStore
```
This creates a new directory in the container and makes it the working directory. Everything else that happens after this point will use MusicStore as the base directory.
```
COPY samples/MusicStore.Standalone/project.json samples/MusicStore.Standalone/project.json
COPY NuGet.config .
```
The command adds the project file (detailing NuGet package dependencies) and the NuGet config file.
```
RUN dotnet restore --no-cache .\samples\MusicStore.Standalone
```
This pulls in the right dependencies to the project.

```
COPY samples samples
RUN dotnet build .\samples\MusicStore.Standalone
```
This adds the rest of the app source code to the container, and compiles the project.
```
EXPOSE 5000
ENV ASPNETCORE_URLS http://0.0.0.0:5000
CMD dotnet run -p .\samples\MusicStore.Standalone
```
These last three commands expose correct ports and set the default run command for the container to run the MusicStore app.
