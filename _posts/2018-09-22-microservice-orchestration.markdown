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
After completion, the application stack will contain the following microservices:

* A web application written in PHP and served using Apache that takes a URL as the input and summarizes extracted links from it
* The web application talks to an API server written in Python (and Ruby) that takes care of the link extraction and returns a JSON response
* A Redis cache that is used by the API server to avoid repeated fetch and link extraction for pages that are already scraped

The API server will only load the page of the input link from the web if it is not in the cache.
The stack will look like the figure below:

![A Microservice Architecture of the Link Extractor Application](/images/linkextractor-microservice-diagram.png)

> **Steps:**
> * Table of contents
> {:toc}

Let's get started by first cloning the demo code repository and changing the working directory.

```.term1
git clone https://github.com/ibnesayeed/linkextractor.git
cd linkextractor
```

## Step 0: Basic Link Extractor Script

Checkout the `step0` branch and list files in it.

```.term1
git checkout -t origin/step0
tree
```

```
.
├── README.md
└── linkextractor.py

0 directories, 2 files
```

The `linkextractor.py` file is the interesting one here, so let's look at its contents:

```.term1
cat linkextractor.py
```

```py
#!/usr/bin/env python

import sys
import requests
from bs4 import BeautifulSoup

res = requests.get(sys.argv[-1])
soup = BeautifulSoup(res.text, "html.parser")
for link in soup.find_all("a"):
    print(link.get("href"))
```

## Step 1: Containerized Link Extractor Script

Checkout the `step1` branch and list files in it.

```.term1
git checkout -t origin/step1
tree
```

```
.
├── Dockerfile
├── README.md
└── linkextractor.py

0 directories, 3 files
```

## Step 2: Link Extractor Module with Full URI and Anchor Text

Checkout the `step2` branch and list files in it.

```.term1
git checkout -t origin/step2
tree
```

```
.
├── Dockerfile
├── README.md
└── linkextractor.py

0 directories, 3 files
```

## Step 3: Link Extractor API Service

Checkout the `step3` branch and list files in it.

```.term1
git checkout -t origin/step3
tree
```

```
.
├── Dockerfile
├── README.md
├── linkextractor.py
├── main.py
└── requirements.txt

0 directories, 5 files
```

## Step 4: Link Extractor API and Web Front End Services

Checkout the `step4` branch and list files in it.

```.term1
git checkout -t origin/step4
tree
```

```
.
├── README.md
├── api
│   ├── Dockerfile
│   ├── linkextractor.py
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml
└── www
    └── index.php

2 directories, 7 files
```

## Step 5: Redis Service for Caching

Checkout the `step5` branch and list files in it.

```.term1
git checkout -t origin/step5
tree
```

```
.
├── README.md
├── api
│   ├── Dockerfile
│   ├── linkextractor.py
│   ├── main.py
│   └── requirements.txt
├── docker-compose.yml
└── www
    ├── Dockerfile
    └── index.php

2 directories, 8 files
```

## Step 6: Swap Python API Service with Ruby

Checkout the `step6` branch and list files in it.

```.term1
git checkout -t origin/step6
tree
```

```
.
├── README.md
├── api
│   ├── Dockerfile
│   ├── Gemfile
│   └── linkextractor.rb
├── docker-compose.yml
├── logs
└── www
    ├── Dockerfile
    └── index.php

3 directories, 7 files
```
