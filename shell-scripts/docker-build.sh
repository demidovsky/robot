REPOSITORY=justdimmy
# VERSION=v$(node -p "require('./package.json').version")
VERSION=latest
NAME=$(node -p "require('./package.json').name")

# # Changing version in package.json invalidates corresponding Docker cache layer.
# # Therefore, `npm install` is run again - even when dependencies are actually unchanged.
# # So we will use package.json with "removed" version instead.

# cp package.json docker.package.json
# cp package-lock.json docker.package-lock.json

# sed -i -- "s/\"version\": \"${VERSION}\"/\"version\": \"0.0.0\"/" docker.package.json
# sed -i -- '3s/.*/  "version": "0.0.0",/' docker.package-lock.json

# rm docker.package.json--
# rm docker.package-lock.json--

echo "Building docker image $NAME:$VERSION"
docker build . --tag=$REPOSITORY/$NAME:$VERSION
