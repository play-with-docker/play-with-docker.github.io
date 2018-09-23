---
layout: post
title:  "Application Containerization and Microservice Orchestration"
date:   2018-09-22
author: "@ibnesayeed"
tags: [beginner, linux, developer, microservice, orchestration, linkextractor, api, python, php, ruby]
categories: beginner
terms: 1
---

In this tutorial we will learn about basic application containerization using Docker and running various components of an application as microservices.
We will utilize [Docker Compose](https://docs.docker.com/compose/) for orchestration during the development.
This tutorial is targeted for beginners who have the basic familiarity with Docker.
If you are new to Docker, we recommend you check out [Docker for Beginners](/beginner-linux) tutorial first.

We will start from a basic Python script that scrapes links from a given web page and gradually evolve it into a multi-service application stack.
The demo code is available in the [Link Extractor](https://github.com/ibnesayeed/linkextractor) repo.
The code is organized in steps that incrementally introduce changes and new concepts.
After completion, the application stack will look like the figure below:

![A Microservice Architecture of the Link Extractor Application](/images/linkextractor-microservice-diagram.png)
