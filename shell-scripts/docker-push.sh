REPOSITORY=justdimmy
# VERSION=v$(node -p "require('./package.json').version")
VERSION=latest
NAME=$(node -p "require('./package.json').name")

echo "Pushing docker image $NAME:$VERSION"
docker push $REPOSITORY/$NAME:$VERSION
