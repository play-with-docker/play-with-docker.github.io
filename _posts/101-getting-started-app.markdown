<div class="page" markdown="1">
For the rest of this tutorial, we will be working with a simple todo
list manager that is running in Node. If you're not familiar with Node,
don't worry! No real JavaScript experience is needed!

At this point, your development team is quite small and you're simply
building an app to prove out your MVP (minimum viable product). You want
to show how it works and what it's capable of doing without needing to
think about how it will work for a large team, multiple developers, etc.

![Todo List Manager Screenshot](../images/todo-list-sample.png){: style="width:50%;" }
{ .text-center }


## Getting our App into PWD

Before we can run the application, we need to get the application source code into 
the Play with Docker environment. For real projects, you can clone the repo. But, in
this case, you will upload a ZIP archive.

1. [Download the zip](/assets/app.zip) and upload it to Play with Docker. As a
   tip, you can drag and drop the zip (or any other file) on to the terminal in PWD.

1. In the PWD terminal, extract the zip file.

    ```bash
    unzip app.zip
    ```

1. Change your current working directory into the new 'app' folder.

    ```bash
    cd app/
    ```

1. In this directory, you should see a simple Node-based application.

    ```bash
    ls
    package.json  spec          src           yarn.lock
    ```


## Building the App's Container Image

In order to build the application, we need to use a `Dockerfile`. A
Dockerfile is simply a text-based script of instructions that is used to
create a container image. If you've created Dockerfiles before, you might
see a few flaws in the Dockerfile below. But, don't worry! We'll go over them.

1. Create a file named Dockerfile with the following contents.

    ```dockerfile
    FROM node:10-alpine
    WORKDIR /app
    COPY . .
    RUN yarn install --production
    CMD ["node", "/app/src/index.js"]
    ```

1. Build the container image using the `docker build` command.

    ```bash
    docker build -t docker-101 .
    ```

    This command used the Dockerfile to build a new container image. You might
    have noticed that a lot of "layers" were downloaded. This is because we instructed
    the builder that we wanted to start from the `node:10-alpine` image. But, since we
    didn't have that on our machine, that image needed to be downloaded.

    After that, we copied in our application and used `yarn` to install our application's
    dependencies. The `CMD` directive specifies the default command to run when starting
    a container from this image.


## Starting an App Container

Now that we have an image, let's run the application! To do so, we will use the `docker run`
command (remember that from earlier?).

1. Start your container using the `docker run` command:

    ```bash
    docker run -dp 3000:3000 docker-101
    ```

    Remember the `-d` and `-p` flags? We're running the new container in "detached" mode (in the 
    background) and creating a mapping between the host's port 3000 to the container's port 3000.

1. Open the application by clicking on the "3000" badge at the top of the PWD interface. Once open,
   you should have an empty todo list!

    ![Empty Todo List](../images/todo-list-empty.png){: style="width:450px;margin-top:20px;"}
    {: .text-center }

1. Go ahead and add an item or two and see that it works as you expect. You can mark items as
   complete and remove items.


At this point, you should have a running todo list manager with a few items, all built by you!
Now, let's make a few changes and learn about managing our containers.


## Recap

In this short section, we learned the very basics about building a container image and created a
Dockerfile to do so. Once we built an image, we started the container and saw the running app!

Next, we're going to make a modification to our app and learn how to update our running application
with a new image. Along the way, we'll learn a few other useful commands.

</div>
