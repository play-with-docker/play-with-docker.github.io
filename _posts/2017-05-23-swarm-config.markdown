---
layout: post
title: "Docker swarm config files"
date:   2017-01-22
author: "@marcosnils"
tags: [developer,operations,linux,swarm]
categories: beginner
terms: 1
---

This tutorials showcases the [config](https://github.com/moby/moby/pull/32336) swarm feature that allow config objects to be attached to services. Config files can be mounted inside services' containers, avoiding the need to bake configuration into images.

Configuration files are similar to secrets, and in fact the CLI and API show few differences between the two. The principal differences so far are:

* Secrets are always redacted at the API level, so the payload cannot be obtained through an API call after they are created.

* Secrets are restricted to the /run/secrets directory inside the container, as a design choice. Config files can be mounted anywhere.
Start securing your swarm services using the latest compose reference that allows to specify secrets in your application stack

## Requirements

Docker 17.06+


## Getting started

Initialize your swarm:

```.term1
docker swarm init --advertise-addr $(hostname -i)
```

Let's peak the `config` options:

```.term1
docker config --help
```

As you can see the API is very similar to the [docker secrets](./2017-01-23-swarm-compose-secrets.markdown). Let's create our first config object

```.term1
echo "this is some crazy config stuff" | docker config create my_config -
```

As stated before, unlike secrets, you can actually see the content of the config objects directly from the CLI. Let's check this:


```.term1
docker config inspect my_config
```

Wait, what?, where's my config?. Docker hides the config information by default to prevent unnecessary large outputs; in order to display 
the config value the `--pretty` flag needs to added

```.term1
docker config inspect --pretty my_config
```

Finally, let's deploy a service using our recently created config

```.term1
docker service create --name test_cfg --config my_config alpine cat /my_config
```

You can check your service logs to see your configuration.

```.term1
docker service logs test_cfg
```

As you can see, as we didn't specify any destination mountpoint, by default configs will be located at the root path. However, with configs
you can place them wherever you need.

```.term1
docker service create --name test_cfg_mount --config source=my_config,target=/tmp/cfg alpine cat /tmp/cfg
```
Same as before, check your service logs to see the expected configuration:

```.term1
docker service logs test_cfg_mount
```




