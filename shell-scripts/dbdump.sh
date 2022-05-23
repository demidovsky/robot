export $(egrep -v '^#' ./../.env | xargs)

echo "Export $POSTGRES_DB..."

docker exec -it --workdir /var/lib/postgresql/data fintech_db_1 /bin/sh -c \
"
pg_dump --username=$POSTGRES_USER $POSTGRES_DB > dbdump.sql
"