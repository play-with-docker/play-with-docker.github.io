# Writing Tutorials
This document shows you how to write a tutorial for the [Play with Docker](http://training.play-with-docker.com/) training site. For more information about Play with Docker, check out our [about page](./about.md).

## Contributing Overview

Play with Docker runs on [Jekyll](https://jekyllrb.com/) and uses a standard Play with Docker tutorials are written in [GitHub flavored Markdown](https://help.github.com/articles/about-writing-and-formatting-on-github/).

To contribute a tutorial, please first read the [contribution guidelines](./contribute.md). Then submit a pull request against this repository, using the directions below.

## File Naming
Play with Docker follows the Jeykll post naming convention. Place a new document in Markdown in the `/_posts` directory with the following naming convention:

YEAR-MONTH-DAY-title.markdown

The date will be used for ordering the post on the front page, not for tracking the date published. We may change that portion of the file name at a later point to change the ordering.

Any supporting images should be placed in the `/images` directory and referenced with `../images/`.

## YAML Front Matter

Each post starts with a [YAML Front Matter](https://jekyllrb.com/docs/frontmatter/) block. This tells the site information it needs to render the post correctly. Not just Jekyll but also the [Play with Docker SDK](https://github.com/play-with-docker/sdk). However, you don't need to know about Jekyll or the SDK to write a post, though. Just make sure that you start a post with the following text block:

```
---
layout: post
title:  "Title of Your Awesome New Tutorial"
date:   YYYY-MM-DD
author: "@your-github-user-name"
tags: [see tags below]
categories: see categories below
terms: 
---
```

Only `terms` is optional, as it defaults to `1`.
* `layout`: for layout, always use `post`
* `title`: the title that will go top of the tutorial
* `date`: must match the date used in the file name
* `author`: use your GitHub user name
* `tags`: must be an array, such as `[linux, operations, webapp]`. This will be used by Play with Docker to populate list of tutorials the front page. Always use lower-case.
* `categories`: choose one of: `beginner`, `intermediate`, `advanced`, `community`. This will be used to place the post in the list of tutorials on the front page. Always use lower-case.
* `terms`: an integer between 0 and 6. This is the number of terminal windows on the tutorial page. This will default to `1` if you don't specify it. If you specify `0`, there won't be any terminals. `0` should only be used if you are giving overview content with no interactivity, or describing a hands-on tutorial that has to run on the reader's local machine or in a VM.

## Formatting

Formatting is pretty standard Markdown. Be aware that if you have one or more terminals, half the page will be taken up with the terminal windows. This is adjustable by the user but you should write as if it won't be shifted. Take a look at the [Swarm mode introduction](http://training.play-with-docker.com/swarm-mode-intro/) tutorial to see what this looks like, and the [In-container Java Development: Netbeans](http://training.play-with-docker.com/java-debugging-netbeans/) tutorial to see what it looks like without a terminal.

You shouldn't need to use any CSS in your tutorials or change any of the CSS in the `/css` directory.

## Auto populating code in the terminal

The Play with Docker SDK allows us to auto populate code into the terminal. Code blocks are specified with triple backticks ` ``` ` on each end. With the addition of a `.termN` after the open set of backticks, you can direct that code block to a specific terminal. For instance, to run code in the first terminal, you would add `.term1`. For instance:

    ````.term1
    docker swarm init --advertise-addr $(hostname -i)
    ````

You can write multiple lines as well as just one, and they will sequentially be added to the terminal. If you do not specify `termN` clicking on the code block will not cause it to be placed in the terminal. This is useful if you want to show example code that someone would copy and paste into a file before running.

## Linking to apps that run in a terminal

Any apps that run in a terminal and expose a port can be discovered for linking purposes. The pattern is:
```
[linktext](/){:data-term=".termN"}{:data-port="XXXX"}
```

For instance, if you wanted to link to a webserver running in terminal 2 at port 8080, you would use:
```
[webserver](/){:data-term=".term2"}{:data-port="8080"}
```

This is necessary because when you write the post you won't know in advance what the base URL of an individual session will be on Play with Docker. That will produce a URL such as this:

```http://pwd10-0-117-3-8080.host2.labs.play-with-docker.com/```

When you are ready, submit your PR against this repository. The Play with Docker team will evaluate it before merging it, and may require changes or close the PR at their discretion.
