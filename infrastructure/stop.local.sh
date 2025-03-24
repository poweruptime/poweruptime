#!/bin/bash

COMPOSE_ARGS="-f _base.yml -f local.yml --env-file versions.env --env-file .env"

# shellcheck disable=SC2086
docker compose $COMPOSE_ARGS down # redeploy the stack
if [ $? -ne 0 ]; then
  echo "ERROR"
  exit 3
fi
