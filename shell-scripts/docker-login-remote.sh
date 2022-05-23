# CMD=$(aws ecr get-login --no-include-email)
DOCKER_PASS=$(grep DOCKER_PASS .env | xargs)
DOCKER_PASS=${DOCKER_PASS#*=}

CMD="docker login -u justdimmy -p $DOCKER_PASS"
ssh -t root@92.255.78.150 $CMD


