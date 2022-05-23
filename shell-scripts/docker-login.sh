# $(aws ecr get-login --no-include-email)

DOCKER_PASS=$(grep DOCKER_PASS .env | xargs)
DOCKER_PASS=${DOCKER_PASS#*=}

docker login -u justdimmy -p $DOCKER_PASS