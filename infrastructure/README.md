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
5. Make sure no other servives listen on port `80` and `443`.
6. Start the stack
   ```shell
   ./start.sh
   ```

### Stop the stack

```shell
./stop.sh
```

## Available environment variables

| Name                             | Description                                                                        | Default value    | Required |
| -------------------------------- | ---------------------------------------------------------------------------------- | ---------------- | -------- |
| `POWERUPTIME_HOST`               | Host / Domain of the poweruptime instance.                                         | -                | ✅       |
| `DOMAIN_NAMES`                   | A list of domain names allowed for the status pages.                               | -                | ❌       |
| `DATABASE_HOST`                  | Hostname or IP address of the database server.                                     | `poweruptime-db` | ✅       |
| `DATABASE_PORT`                  | Port number used to connect to the database server.                                | `5432`           | ✅       |
| `DATABASE_NAME`                  | Name of the database to be used by the poweruptime.                                | `poweruptime`    | ✅       |
| `DATABASE_USERNAME`              | Username for authenticating with the database server.                              | `poweruptime`    | ✅       |
| `DATABASE_PASSWORD`              | Password for authenticating with the database server.                              | -                | ✅       |
| `RABBIT_HOST`                    | Hostname or IP address of the RabbitMQ server.                                     | `poweruptime-db` | ✅       |
| `RABBIT_PORT`                    | Port number used to connect to the RabbitMQ server.                                | `5432`           | ✅       |
| `RABBIT_USERNAME`                | Username for authenticating with the RabbitMQ server.                              | `poweruptime`    | ✅       |
| `RABBIT_PASSWORD`                | Password for authenticating with the RabbitMQ server.                              | -                | ✅       |
| `MAIL_ENABLED`                   | Value indicating whether email functionality is enabled.                           | `true`           | ✅       |
| `MAIL_HOST`                      | Hostname or IP address of the mail server.                                         | -                | ✅       |
| `MAIL_PORT`                      | Port number used to connect to the mail server.                                    | -                | ✅       |
| `MAIL_USERNAME`                  | Username for authenticating with the mail server.                                  | -                | ✅       |
| `MAIL_PASSWORD`                  | Password for authenticating with the mail server.                                  | -                | ✅       |
| `MAIL_SECURITY`                  | The type of security to use for email communication.                               | `NONE_STARTTLS`  | ✅       |
| `MAIL_IGNORE_TLS_ERRORS`         | Value indicating whether to ignore TLS errors when connecting to the mail server.  | `false`          | ✅       |
| `PUSH_ENABLED`                   | Value indicating whether push notifications are enabled.                           | `true`           | ✅       |
| `TEMP_NOTIFICATIONS_ENABLED`     | Value indicating whether temporary notifications are enabled for testing purposes. | `false`          | ✅       |
| `SWAGGER_ENABLED`                | Value indicating whether the Swagger/OpenAPI documentation interface is enabled.   | `false`          | ✅       |
| `RATE_LIMIT_ENABLED`             | Value indicating whether rate limiting is enabled.                                 | `true`           | ✅       |
| `RATE_LIMIT_DURATION_IN_SECONDS` | Duration, in seconds, of the rate limiting window.                                 | `240`            | ✅       |
| `RATE_LIMIT_TRIES`               | Maximum number of requests allowed within the rate limiting window.                | `40`             | ✅       |

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
