docker stop fintech && \
docker rm fintech && \

docker run \
  -d \
  --name fintech \
  -v $(pwd)/.env:/.env \
  justdimmy/fintech:latest && \

sleep 2 && docker logs fintech

# OR
# docker-compose stop app && docker-compose up -d app && sleep 5 && docker-compose logs app