---
layout: post
title: "Docker compose with swarm secrets"
date:   2017-01-23
author: "@marcosnils"
tags: [developer,operations,linux, swarm, community]
categories: beginner
img: "docker-secrets.png"
---

Start securing your swarm services using the latest compose reference that allows to specify secrets in your application stack

## Getting started

Make sure your daemon is in swarm mode or initialize it as follows:

```.term1
docker swarm init --advertise-addr $(hostname -i)
```

### Automatic provision

In this example we'll let compose automatically create our secrets and provision them through compose with the defined secret file

Create a new secret and store it in a file:

```.term1
echo "shh, this is a secret" > mysecret.txt
```

Use your secret file in your compose stack as follows:

```.term1
echo 'version: '\'3.1\''
services:
    test:
        image: '\'alpine\''
        command: '\'cat /run/secrets/my_secret \''
        secrets: 
            - my_secret

secrets:
    my_secret:
        file: ./mysecret.txt
' > docker-compose.yml
```

Deploy your stack service:


```.term1
docker stack deploy -c docker-compose.yml secret
```

Results in the below output:
```
Creating network secret_default
Creating secret secret_my_secret
Creating service secret_test
```

After your stack is deployed you can check your service output:


```.term1
docker service logs -f secret_test
```

Results in the below output (below values after `secret_test.1.` may vary):
```
secret_test.1.lcygnppmzfdp@node1    | shhh, this is a secret
secret_test.1.mg1420w2i3x4@node1    | shhh, this is a secret
secret_test.1.8osraz8yxjrb@node1    | shhh, this is a secret
secret_test.1.byh5b9uik6db@node1    | shhh, this is a secret
.
.
.
```

### Using existing secrets

Create a new secret using the docker CLI:


```.term1
echo "some other secret" | docker secret create manual_secret - 
```

Define your secret as `external` in your compose file so it's not created while deploying the stack

```.term1
echo 'version: '\'3.1\''
services:
    test:
        image: '\'alpine\''
        command: '\'cat /run/secrets/manual_secret \''
        secrets: 
            - manual_secret

secrets:
    manual_secret:
        external: true
' > external-compose.yml
```

Deploy your stack as you did in the automatic section:

```.term1
docker stack deploy -c external-compose.yml external_secret
```

Validate your secret is there by checking the service logs

```.term1
docker service logs -f external_secret_test
```


