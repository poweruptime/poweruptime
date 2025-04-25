# poweruptime/docker-compose

Docker Compose configuration for running [poweruptime](https://github.com/poweruptime/poweruptime).

|                           **Container Registries**                           |
| :--------------------------------------------------------------------------: |
|     [Web](https://github.com/poweruptime/poweruptime/pkgs/container/web)     |
| [Backend](https://github.com/poweruptime/poweruptime/pkgs/container/backend) |

## How to install

1. Clone the [docker-compose repository](https://github.com/poweruptime/docker-compose).
   ```shell
   git clone https://github.com/poweruptime/docker-compose.git poweruptime && cd ./poweruptime
   ```
2. Checkout specific version (or just stay on main, which is the latest release)
   ```shell
   git checkout vX.X.X
   ```
3. Copy `.env.exmaple` to `.env`
   ```shell
   cp .env.example .env
   ```
4. Fill out the necessary .env variables.

   ```shell
   nano .env
   ```

   ```shell
   vim .env
   ```

   Generate secrets for `DATABASE_PASSWORD` and `POSTGRES_PASSWORD` with the `openssl` command:

   ```shell
   openssl rand -base64 64 | tr -dc A-Za-z0-9 | head -c 60 ; echo
   ```

5. Make sure no other services listen on port `80` and `443`.
6. Start the stack
   ```shell
   ./start.sh
   ```

### Stop the stack

```shell
./stop.sh
```

## Environment variables

### General

| Name               | Description                                                                                                                                                                       | Default value | Required |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | -------- |
| `POWERUPTIME_HOST` | Host / Domain of the poweruptime instance.                                                                                                                                        |               | x        |
| `DOMAIN_NAMES`     | A list of domain names allowed for the status pages. Examples: ``DOMAIN_NAMES="Host(`status.abc.xyz`)"``, ``DOMAIN_NAMES="Host(`status1.abc.xyz`) \|\| Host(`status2.abc.xzy`)"`` |               |          |

### Database

| Name                | Description                                           | Default value    | Required |
| ------------------- | ----------------------------------------------------- | ---------------- | -------- |
| `DATABASE_HOST`     | Hostname or IP address of the database server.        | `poweruptime-db` | x        |
| `DATABASE_PORT`     | Port number used to connect to the database server.   | `5432`           | x        |
| `DATABASE_NAME`     | Name of the database to be used by the poweruptime.   | `poweruptime`    | x        |
| `DATABASE_USERNAME` | Username for authenticating with the database server. | `poweruptime`    | x        |
| `DATABASE_PASSWORD` | Password for authenticating with the database server. |                  | x        |

### RabbitMQ

| Name              | Description                                           | Default value          | Required |
| ----------------- | ----------------------------------------------------- | ---------------------- | -------- |
| `RABBIT_HOST`     | Hostname or IP address of the RabbitMQ server.        | `poweruptime-rabbitmq` | x        |
| `RABBIT_PORT`     | Port number used to connect to the RabbitMQ server.   | `5672`                 | x        |
| `RABBIT_USERNAME` | Username for authenticating with the RabbitMQ server. | `poweruptime`          | x        |
| `RABBIT_PASSWORD` | Password for authenticating with the RabbitMQ server. |                        | x        |

### Mailing

These configuration values only effect the System E-Mail service.

| Name                     | Description                                                                   | Default value   | Required |
| ------------------------ | ----------------------------------------------------------------------------- | --------------- | -------- |
| `MAIL_ENABLED`           | Whether email functionality is enabled.                                       | `true`          | x        |
| `MAIL_HOST`              | Hostname or IP address of the mail server.                                    |                 | x        |
| `MAIL_PORT`              | Port number used to connect to the mail server.                               |                 | x        |
| `MAIL_USERNAME`          | Username for authenticating with the mail server.                             |                 | x        |
| `MAIL_PASSWORD`          | Password for authenticating with the mail server.                             |                 | x        |
| `MAIL_SECURITY`          | The type of security to use for email communication. (`NONE_STARTTLS`, `TLS`) | `NONE_STARTTLS` | x        |
| `MAIL_IGNORE_TLS_ERRORS` | Whether to ignore TLS errors when connecting to the mail server.              | `false`         | x        |

### Rate Limiting

| Name                             | Description                                                         | Default value | Required |
| -------------------------------- | ------------------------------------------------------------------- | ------------- | -------- |
| `RATE_LIMIT_ENABLED`             | Whether rate limiting is enabled.                                   | `true`        | x        |
| `RATE_LIMIT_DURATION_IN_SECONDS` | Duration, in seconds, of the rate limiting window.                  | `240`         | x        |
| `RATE_LIMIT_TRIES`               | Maximum number of requests allowed within the rate limiting window. | `40`          | x        |

### Development

| Name                         | Description                                                       | Default value | Required |
| ---------------------------- | ----------------------------------------------------------------- | ------------- | -------- |
| `PUSH_ENABLED`               | Whether push notifications are enabled.                           | `true`        | x        |
| `TEMP_NOTIFICATIONS_ENABLED` | Whether temporary notifications are enabled for testing purposes. | `false`       | x        |
| `SWAGGER_ENABLED`            | Whether the Swagger/OpenAPI documentation interface is enabled.   | `false`       | x        |

## Good to know

### Get merged docker compose config

```shell
docker compose -f _base.yml -f local.yml --env-file local.env config
```

Will print the merged config of [\_base.yml](_base.yml) and [local.yml](local.yml) file to
standard out.

### Use a specific version for local testing

Go to the [versions.env](versions.env) file, and change the version you need.

## Running locally

Simply use the IntelliJ `Local` run configuration or run the following command to start the whole stack locally:

```shell
bash start.local.sh
```

- Web interface: [http://localhost/](http://localhost/)
- API: [http://localhost/api](http://localhost/api)
- Traefik dashboard: [http://localhost/traefik](http://localhost/traefik)
- RabbitMQ Management: [http://localhost/rabbit/](http://localhost/rabbit/)
  - Username: `poweruptime`
  - Password: `poweruptime`
