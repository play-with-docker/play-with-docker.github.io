---
layout: post
title: "Reducing nodejs Docker images size by %50 using multi-stage builds and Zeit pkg."
date:   2017-05-04
author: "@marcosnils"
tags: [linux,development, nodejs, community]
categories: community
image: franela/dind
---

This is a followup interactive tutorial from this [blogpost](https://medium.com/@marcosnils/reducing-nodejs-docker-images-size-by-47-using-multi-sage-builds-and-zeit-pkg-360ab8b6c6d2)
to reduce docker nodejs images by 50% using Zeit [pkg](https://github.com/zeit/pkg) and docker multi-stage builds.


## The traditional way

Before jumping into the magic trick, we'll build a nodejs docker image as we would do traditionally to show the
space that we're saving by using this new approach.

Let's create a simple node application:

```.term1
echo 'console.log("Hello, pkg")' | tee index.js
```

We'll now package it using a very basic dockerfile

```.term1
echo 'FROM node:boron-slim
COPY . /app
CMD ["node", "/app/index.js"] ' | tee Dockerfile
```

Finally, we'll build our image and check it's size:

```.term1
docker build -t myapp .
docker image ls | grep myapp
```

You can see that our `myapp` is 200+MB 


## Using PKG and multi-stage builds

Let's create now a new Dockerfile that bundles our app with `pkg` and uses multi-stage builds to package
it in a smaller docker image

```.term1
echo 'FROM node:boron
RUN npm install -g pkg pkg-fetch

ENV NODE node6
ENV PLATFORM linux
ENV ARCH x64

RUN /usr/local/bin/pkg-fetch ${NODE} ${PLATFORM} ${ARCH}

COPY . /app
WORKDIR /app
RUN /usr/local/bin/pkg --targets ${NODE}-${PLATFORM}-${ARCH} index.js

FROM debian:jessie-slim
COPY --from=0  /app/index /
CMD ["/index"]' | tee Dockerfile-pkg
```

We'll build our app the same way as before but using our new Dockerfile:

```.term1
docker build -t myapp_pkg -f Dockerfile-pkg .
docker image ls | grep myapp_pkg
```

As you can see, our new docker image is around 100MB and it works as expected:

```.term1
docker run myapp_pkg
```



