# Contributing

Just check the [posts](https://github.com/franela/franela.github.io/tree/master/_posts) folder and submit your tutorials there.

# Running trainings site

Clone this repo and run `docker-compose up` from the root directory of the repo.  Browse the site by visiting http://localhost:4000

Alternately, clone the repo and run the following docker container: `docker run --rm --label=jekyll --volume=$(pwd):/srv/jekyll -it -p 4000:4000 jekyll/jekyll:3.2 jekyll serve`

Browse the site by visiting http://localhost:4000

