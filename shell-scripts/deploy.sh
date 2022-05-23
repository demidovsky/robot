ssh root@92.255.78.150 \
"cd fintech && eval docker-compose pull && docker-compose up -d && sleep 3 && docker-compose logs --tail 10"