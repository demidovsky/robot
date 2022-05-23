docker-compose stop app && \
docker-compose rm -f app && \
docker-compose up -d && \
sleep 5 && \
docker-compose logs app