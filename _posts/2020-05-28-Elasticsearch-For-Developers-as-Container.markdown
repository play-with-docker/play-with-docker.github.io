---
layout: post
title: "Elasticsearch as  a container for begginers"
date:   2020-05-28
author: "@JinnaBalu"
tags: [Elasticsearch, SingleNode, Docker]
categories: community
terms: 1
---
# Elasticsearch Single Node with Kibana

In this scenario, you'll learn how to deploy a Elasticsearch and Kibana as a Docker Container.

Elasticsearch single is recommended for dev and monitoring but not for the production or primary store. 

If we have a proper backup strategy still we can risk running a single node in the production too but we don't get all the feature set like fault tolerance and distributed cluster, this is at high risk.

Let us understand how we can start the single node container in this scenario, expecting that you are familiar  with `docker` and `docker-compose` commands.

## Agenda

- Create the docker-compose
- Understand the properties used in Elasticsearch and Kibana
- Health check with 
    - Kibana Console UI 
    - `curl` Command 
- Create a simple document with 
    - mappings
    - settings
- Insert Data into the created index

## Create the docker-compose

Create the `docker-compose.yml` with the following

```.term1
cat <<EOF >>docker-compose.yml

version: "3"
services:
    elasticsearch:
        image: docker.elastic.co/elasticsearch/elasticsearch:7.7.0
        container_name: elasticsearch
        environment:
            - discovery.type=single-node
            - ES_JAVA_OPTS="-Xms1g -Xmx1g"
        volumes:
            - vibhuviesdata:/usr/share/elasticsearch/data
        ports:
            - 9200:9200
        networks:
            - elastic
        labels:
            - co.elastic.logs/module=elasticsearch
            - co.elastic.metrics/module=elasticsearch
    kibana:
        image: docker.elastic.co/kibana/kibana:7.7.0
        container_name: kibana
        ports:
            - 5601:5601
        depends_on:
            - elasticsearch
        environment:
            ELASTICSEARCH_URL: http://elasticsearch:9200
            ELASTICSEARCH_HOSTS: http://elasticsearch:9200
        networks:
            - elastic
networks:
    elastic:
      driver: bridge  
volumes:
    vibhuviesdata:
      driver: local

EOF
```


Check the content of `docker-compose.yml` file 


```.term1
cat docker-compose.yml
```

## Understands the Environment and Run the container

As mentioned in the intro hope you are familiar with the docker container commands, expecting that we proceed with the environment we have configured for the elasticsearch. 

In the docker-compose we have defined two services `elasticsearch` and `kibana`. Let's look at the other properties defined.

### Elasticsearch 

- `image: docker.elastic.co/elasticsearch/elasticsearch:7.7.0` - Image of version `7.7.0`
- `container_name` - Custom name of the container 
- `environment` -  To run the single need we need to set the container environment with `discovery.type: single-node` and Optional but important when we are running in dev machine `ES_JAVA_OPTS: "-Xms512m -Xmx1024m"`
- `volumes` to maintain the persistancy on restarting the container else we loose the data when we restart the container. Here we have host volume `vibhuviesdata` and container volume `/usr/share/elasticsearch/data`. Host Volume maintains the data for multiple restarts of the container.
- `ports` - Elasticsearch will use port 9200 for requests and port 9300 for communication between nodes within the cluster.
- `networks` - To maintain the security from the other networks in the docker we have created a common network for both kibana and elasticsearch

### Kibana

- `image: docker.elastic.co/kibana/kibana:7.7.0` - We have to use the same version as elasticsearch after `4.6.*`. Check the [Kibana Compatibility with Elasticsearch Matrix](https://www.elastic.co/support/matrix#matrix_compatibility)
- `container_name` - Custom name of the container 
- `environment` -  Kibana is connecting to the container elasticsearch with teh service name and port.
- `ports` - Kibana will use port 9200 for visualising the elasticsearch
- `depends_on` - The property tell the Kibana service to run after elasticsearch

## Run the container

```.term1
docker-compose up -d
```

### Docker Commands

- Check the status of the container 

```.term1
docker container ls -a
```

- Check the logs of the Elasticsearch 

```.term1
docker logs elasticsearch
```

- Check the logs of the Kibana

```.term1
docker logs kibana
```

- Output contains  

    - Elasticsearch - `"message": "Cluster health status changed from [YELLOW] to [GREEN]`

    - Kibana - `"message":"http server running at http://0:5601"`

This means that both containers are running successfully

## Interaction with Elasticsearch Cluster API

We have Elasticsearch running, let's try to interact with elaticsearch APIs

We have two options to intearct with Elasticsearch `curl` and `Kibana Console UI`

### Curl

- Cluster health API 

    ```.term1
    curl -X GET "localhost:9200/_cluster/health?pretty"
    ```

- Cluster state API

    ```.term1
    curl -X GET "localhost:9200/_cluster/state/_all?pretty"
    ```

- Cluster Stats API

    ```.term1
    curl -X GET "localhost:9200/_cluster/stats"
    ```

- Cluster Settings API

    ```.term1
    curl -X GET "localhost:9200/_cluster/settings"
    ```


### Kibana UI

- Cluster health API - GET /_cluster/health

- Cluster state API - GET /_cluster/state/_all

- Cluster Stats API - GET /_cluster/stats

- Cluster Settings API - GET /_cluster/settings

## Frequently used commands

- Check the status of the Elasticsearch

- Check the health status of the Elasticsearch

```.term1
curl -X GET "localhost:9200/_cat/health"
```

- Get the number of nodes of the Elasticsearch Cluster

```.term1
curl -X GET "localhost:9200/_cat/nodes"
```

- Check with the shards with 

```.term1
curl -X GET "localhost:9200/_cat/shards"
```

- Get list of indices

```.term1
curl -X GET "localhost:9200/_cat/indices?v"
```

- Get list of indices with specific column, we want to the column index, which will list the index names

```.term1
curl -X GET "localhost:9200/_cat/indices?v&h=index"
```

- Get the list of indices sort by column

```.term1
curl -X GET "localhost:9200/_cat/indices?v&s=docs.count:desc"

curl -X GET "localhost:9200/_cat/indices?v&s=docs.count:asc"

curl -X GET "localhost:9200/_cat/indices?v&s=index"

curl -X GET "localhost:9200/_cat/indices?v&s=docs.count:desc"

curl -X GET "localhost:9200/_cat/indices?v&s=docs.count:desc"
```

## Create Index

Let's get into the actual dev stuff required for any developer to use elasticsearch with any client. Lets create a index using Index API.

- Create index 

```.term1
curl -X PUT "localhost:9200/twitter?pretty"
```

- Create the index with settings

```.term1
curl -sXPUT 'http://localhost:9200/customer/?pretty' -d '{
  "settings" : {
      "index" : {
          "number_of_shards" : 5,
          "number_of_replicas" : 0
      }
  }
}'

```

- Insert bulk data into the index created 

```.term1
for i in `seq 1 500`; do
  curl -sXPUT "localhost:9200/customer/external/$i?pretty" -d "
  {
    \"number\": $i,
    \"name\": \"John Doe - $i\"
  }"
done
```


- Create student entity with 1000 records 

```.term1
curl -sXPUT 'http://localhost:9200/student/?pretty' -d '{
  "settings" : {
      "index" : {
          "number_of_shards" : 5,
          "number_of_replicas" : 0
      }
  }
}'

for i in `seq 1 20`; do
  curl -sXPUT "localhost:9200/student/external/$i?pretty" -d "
  {
    \"number\": $i,
    \"name\": \"Ram - $i\"
  }"
done
```

- Create index with mappings and settings


```.term1
curl -X PUT "localhost:9200/school?pretty" -H 'Content-Type: application/json' -d'
{
    "settings" : {
        "number_of_shards" : 3,
        "number_of_replicas" : 2
    },
    "mappings" : {
        "properties" : {
            "name" : { "type" : "text" }
        }
    }
}
'
```

### Delete index

```.term1
curl -X DELETE "localhost:9200/school?pretty"
```

### Get Index

- Get the mappings and setting with the following

```.term1
curl -X GET "localhost:9200/school?pretty"
```
```.term1
curl -X GET "localhost:9200/school/_mapping?pretty"
```
```.term1
curl -X GET "localhost:9200/school/_settings?pretty"

```

- Checks if an index exists

```.term1
curl -I "localhost:9200/twitter?pretty"
```

- Get the count of Index

```.term1
curl -I "localhost:9200/twitter/_count?pretty"
```

- Update index settings API

```.term1
curl -X PUT "localhost:9200/school/_settings?pretty" -H 'Content-Type: application/json' -d'
{
    "index" : {
        "number_of_replicas" : 2
    }
}
'
```

- Get the Statistics of the index

```.term1
curl -X GET "localhost:9200/school/_stats?pretty"
```
```.term1
curl -X GET "localhost:9200/_stats?pretty"
```
```.term1
curl -X GET "localhost:9200/index1,index2/_stats?pretty"
```

Congratulations! We successfully completed the basics in elasticsearch. 
