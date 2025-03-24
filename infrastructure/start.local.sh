#!/bin/bash

docker login ghcr.io # make sure that we are logged in to the github container registry (if not it will prompt for credentials)
if [ $? -ne 0 ]; then
  echo "ERROR"
  exit 1
fi

COMPOSE_ARGS="-f _base.yml -f local.yml --env-file versions.env --env-file .env"

# shellcheck disable=SC2086
docker compose $COMPOSE_ARGS pull # get the latest images
if [ $? -ne 0 ]; then
  echo "ERROR"
  exit 2
fi

# shellcheck disable=SC2086
docker compose $COMPOSE_ARGS up -d # redeploy the stack
if [ $? -ne 0 ]; then
  echo "ERROR"
  exit 3
fi

echo "Successfully started poweruptime locally."
echo "  - Web interface: http://localhost/"
echo "  - API: http://localhost/api"
echo "  - Traefik dashboard: http://localhost/traefik/dashboard/"
echo "  - RabbitMQ Management: http://localhost/rabbit/"
