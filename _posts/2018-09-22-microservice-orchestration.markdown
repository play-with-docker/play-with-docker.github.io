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

This is a simple Python script that imports three packages: `sys` from the standard library and two popular third-party packages `requests` and `bs4`.
User-supplied command line argument (which is expected to be a URL to an HTML page) is used to fetch the page using the `requests` package, then parsed using the `BeautifulSoup`.
The parsed object is then iterated over to find all the anchor elements (i.e., `<a>` tags) and print the value of their `href` attribute that contains the hyperlink.

However, this seemingly simple script might not be the easiest one to run on a machine that does not meet its requirements.
The `README.md` file suggests how to run it, so lets give it a try:

```.term1
./linkextractor.py http://example.com/
```

```
bash: ./linkextractor.py: Permission denied
```

When we tried to execute it as a script, we got the `Permission denied` error.
Let's check the current permissions on this file:

```.term1
ls -l linkextractor.py
```

```
-rw-r--r--    1 root     root           220 Sep 23 16:26 linkextractor.py
```

This current permission `-rw-r--r--` indicates that the script is not set to be executable.
We can either change it by running `chmod a+x linkextractor.py` or run it as a Python program instead of a self-executing script as illustrated below:

```.term1
python linkextractor.py
```

```py
Traceback (most recent call last):
  File "linkextractor.py", line 5, in <module>
    from bs4 import BeautifulSoup
ImportError: No module named bs4
```

Here we got the first `ImportError` message because we are missing the third-party package needed by the script.
We can install that Python package (and potentially other missing packages) using one of the many techniques to make it work, but it is too much work for such a simple script, which might not be obvious for those who are not familiar with Python's ecosystem.

Depending on which machine and operating system you are trying to run this script on, what software is already installed, and how much access you have, you might face some of these potential difficulties:

* Is the script executable?
* Is Python installed on the machine?
* Can you install software on the machine?
* Is `pip` installed?
* Are `requests` and `beautifulsoup4` Python libraries installed?

This is where application containerization tools like Docker come in handy.
In the next step we will try to containerize this script and make it easier to execute.

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

We have added one new file (i.e., `Dockerfile`) in this step.
Let's look into its contents:

```.term1
cat Dockerfile
```

```Dockerfile
FROM       python
LABEL      maintainer="Sawood Alam <@ibnesayeed>"

RUN        pip install beautifulsoup4
RUN        pip install requests

WORKDIR    /app
COPY       linkextractor.py /app/
RUN        chmod a+x linkextractor.py

ENTRYPOINT ["./linkextractor.py"]
```

Using this `Dockerfile` we can prepare a Docker image for this script.
We start from the official `python` Docker image that contains Python's run-time environment as well as necessary tools to install Python packages and dependencies.
We then add some metadata as labels (this step is not essential, but is a good practice nonetheless).
Next two instructions run the `pip install` command to install the two third-party packages needed for the script to function properly.
We then create a working directory `/app`, copy the `linkextractor.py` file in it, and change its permissions to make it an executable script.
Finally, we set the script as the entrypoint for the image.

So far, we have just described how we want our Docker image to be like, but didn't really build one.
So let's do just that:

```.term1
docker image build -t linkextractor:step1 .
```

This command should yield an output as illustrated below:

```
Sending build context to Docker daemon  171.5kB
Step 1/8 : FROM       python

... [OUTPUT REDACTED] ...

Successfully built 226196ada9ab
Successfully tagged linkextractor:step1
```

We have crated a Docker image named `linkextractor:step1` based on the `Dockerfile` illustrated above.
If the build was successful, we should be able to see it in the list of image:

```.term1
docker image ls
```

```
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
linkextractor       step1               e067c677be37        2 seconds ago       931MB
python              latest              a9d071760c82        2 weeks ago         923MB
```

This image should have all the necessary ingredients packaged in it to run the script anywhere on a machine that supports Docker.
Now, let's run a one-off container with this image and extract links from some live web pages:

```.term1
docker container run -it --rm linkextractor:step1 http://example.com/
```

This outputs a single link that is present in the simple [example.com](http://example.com/) web page:

```
http://www.iana.org/domains/example
```

Let's try it on a web page with more links in it:

```.term1
docker container run -it --rm linkextractor:step1 https://training.play-with-docker.com/
```

```
/
/about/
#ops
#dev
/ops-stage1
/ops-stage2
/ops-stage3
/dev-stage1
/dev-stage2
/dev-stage3
/alacart
https://2018.dockercon.com/
https://2018.dockercon.com/
https://training.docker.com/instructor-led-training
 https://community.docker.com/registrations/groups/4316
https://twitter.com/intent/tweet?text=Play with Docker Classroom&url=https://training.play-with-docker.com/&via=docker&related=docker
https://facebook.com/sharer.php?u=https://training.play-with-docker.com/
https://plus.google.com/share?url=https://training.play-with-docker.com/
http://www.linkedin.com/shareArticle?mini=true&url=https://training.play-with-docker.com/&title=Play%20with%20Docker%20Classroom&source=https://training.play-with-docker.com
https://docker.com
https://www.docker.com
https://www.facebook.com/docker.run
https://twitter.com/docker
https://www.github.com/play-with-docker/play-with-docker.github.io
```

This looks good, but we can improve the output.
For example, some links are relative, we can convert them into full URLs and also provide the anchor text they are linked to.
In the next step we will make these changes and some other improvements to the script.

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

In this step the `linkextractor.py` script is updated with the following functional changes:

* Paths are normalized to full URLs
* Reporting both links and anchor texts
* Usable as a module in other scripts

Let's have a look at the updated script:

```.term1
cat linkextractor.py
```

```py
#!/usr/bin/env python

import sys
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract_links(url):
    res = requests.get(url)
    soup = BeautifulSoup(res.text, "html.parser")
    base = url
    # TODO: Update base if a <base> element is present with the href attribute
    links = []
    for link in soup.find_all("a"):
        links.append({
            "text": " ".join(link.text.split()) or "[IMG]",
            "href": urljoin(base, link.get("href"))
        })
    return links

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("\nUsage:\n\t{} <URL>\n".format(sys.argv[0]))
        sys.exit(1)
    for link in extract_links(sys.argv[-1]):
        print("[{}]({})".format(link["text"], link["href"]))
```

The link extraction logic is abstracted into a function `extract_links` that accepts a URL as a parameter and returns a list of objects containing anchor texts and normalized hyperlinks.
This functionality can now be imported into other scripts as a module (which we will utilize in the next step).

Now, let's build a new image and see these changes in effect:

```.term1
docker image build -t linkextractor:step2 .
```

We have used a new tag `linkextractor:step2` for this image so that we don't overwrite the image from the `step0` to illustrate that they can co-exist and containers can be run using either of these images.

```.term1
docker image ls
```

```
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
linkextractor       step2               be2939eada96        3 seconds ago       931MB
linkextractor       step1               673d045a822f        About a minute ago   931MB
python              latest              a9d071760c82        2 weeks ago          923MB
```

Running a one-off container using the `linkextractor:step2` image should now yield an improved output:

```.term1
docker container run -it --rm linkextractor:step2 https://training.play-with-docker.com/
```

```
[Play with Docker classroom](https://training.play-with-docker.com/)
[About](https://training.play-with-docker.com/about/)
[IT Pros and System Administrators](https://training.play-with-docker.com/#ops)
[Developers](https://training.play-with-docker.com/#dev)
[Stage 1: The Basics](https://training.play-with-docker.com/ops-stage1)
[Stage 2: Digging Deeper](https://training.play-with-docker.com/ops-stage2)
[Stage 3: Moving to Production](https://training.play-with-docker.com/ops-stage3)
[Stage 1: The Basics](https://training.play-with-docker.com/dev-stage1)
[Stage 2: Digging Deeper](https://training.play-with-docker.com/dev-stage2)
[Stage 3: Moving to Staging](https://training.play-with-docker.com/dev-stage3)
[Full list of individual labs](https://training.play-with-docker.com/alacart)
[[IMG]](https://2018.dockercon.com/)
[DockerCon 2018 in San Francisco](https://2018.dockercon.com/)
[training.docker.com](https://training.docker.com/instructor-led-training)
[Register here](https://training.play-with-docker.com/ https:/community.docker.com/registrations/groups/4316)
[[IMG]](https://twitter.com/intent/tweet?text=Play with Docker Classroom&url=https://training.play-with-docker.com/&via=docker&related=docker)
[[IMG]](https://facebook.com/sharer.php?u=https://training.play-with-docker.com/)
[[IMG]](https://plus.google.com/share?url=https://training.play-with-docker.com/)
[[IMG]](http://www.linkedin.com/shareArticle?mini=true&url=https://training.play-with-docker.com/&title=Play%20with%20Docker%20Classroom&source=https://training.play-with-docker.com)
[Docker, Inc.](https://docker.com)
[[IMG]](https://www.docker.com)
[[IMG]](https://www.facebook.com/docker.run)
[[IMG]](https://twitter.com/docker)
[[IMG]](https://www.github.com/play-with-docker/play-with-docker.github.io)
```

Running a container using the previous image `linkextractor:step1` should still result in the old output:

```.term1
docker container run -it --rm linkextractor:step1 https://training.play-with-docker.com/
```

So far, we have learned how to containerize a script with its necessary dependencies to make it more portable.
We have also learned how to make changes in the application and build different variants of Docker images that can co-exist.
In the next step we will build a web service that will utilize this script and will make the service run inside a Docker container.

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
