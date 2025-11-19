# poweruptime/docker-compose

Docker Compose configuration for running [poweruptime](https://github.com/poweruptime/poweruptime).

## Table of contents

1. [How to Install](#how-to-install)
2. [Commands](#commands)
3. [OAuth2 Guide](#oauth2-guide)
4. [Environment variables](#environment-variables)
5. [Other stuff](#good-to-know)

## How to install

1. Clone the [docker-compose repository](https://github.com/poweruptime/docker-compose).
   ```shell
   git clone https://github.com/poweruptime/docker-compose.git poweruptime && cd ./poweruptime && chmod +x ./pu
   ```
2. **(Optional)** Checkout specific version (or just stay on main, which is the latest release)
   ```shell
   git checkout X.X.X
   ```
   ```shell
   git checkout beta
   ```

### Automatic

3. Setup
   ```shell
   ./pu setup
   ```
   You can also start the stack

### Manual

3. Make sure no other services listen on port `80` and `443`.

4. Copy `.env.exmaple` to `.env`
   ```shell
   cp .env.example .env
   ```
5. Fill out the necessary .env variables.

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

   > [!NOTE]  
   > The `DATABASE_PASSWORD` is also used for encrypting your database backups.

6. Start the stack
   ```shell
   ./pu start
   ```

### Commands

#### Start the stack

```shell
./pu start
```

#### Stop the stack

```shell
./pu stop
```

#### Update the stack

```shell
./pu update
```

## OAuth2 Guide

Enabling OAuth2 lets any user registered with your Identity Provider (IdP) log in (or create an account) on your poweruptime instance.

Accounts are matched by E-Mail address: if an OAuth2 user’s E-Mail matches an existing account, they simply log into that account.

1. User Uniqueness
   - Identification is by E-Mail address only.
   - No duplicate accounts: the same E-Mail always maps to one user.

2. Feature Parity

   Users who sign up or log in via OAuth2 have exactly the same capabilities as those who register via the dashboard:
   - Deactivate/reactivate accounts
   - Set up MFA
     - OAuth2 login skips MFA,
     - but MFA still applies when logging in with E-Mail & password
   - Reset password
   - Change password (the initial password for an user registered/created via OAuth2 user is randomly generated behind the scenes)
   - Join teams
   - Be granted admin rights

3. Limitations
   - With OAuth2 is enabled, users cannot change their E-Mail address (this restriction applies instance-wide to all users).

All other user-management operations work exactly the same, regardless of how the account was created.

### Google

Take a look at what [environment variables need to be set](#google-1) and checkout [Google's OAuth2 docs](https://developers.google.com/identity/protocols/oauth2).

Please note that you have to fill in all variables without a default value.

### Keycloak (or any other OAuth2 Provider)

Take a look at what [environment variables need to be set](#keycloak-or-any-other-oauth2-provider-1) and checkout [Keycloak's OAuth2 docs](https://www.keycloak.org/docs/latest/server_admin/index.html).

Please note that you have to fill in all variables without a default value.

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

### OAuth2

#### Google

| Name                          | Description                                                    | Default value                                     | Required |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------------- | -------- |
| `OAUTH2_GOOGLE_CLIENT_ID`     | Your Google OAuth2 Client ID from the Google Cloud Console     |                                                   |          |
| `OAUTH2_GOOGLE_CLIENT_SECRET` | Your Google OAuth2 Client Secret                               |                                                   |          |
| `OAUTH2_GOOGLE_REDIRECT_URI`  | Callback URI registered in Google (where Google will redirect) | `{POWERUPTIME_HOST}/api/login/oauth2/code/google` |          |

#### Keycloak (or any other OAuth2 Provider)

| Name                                      | Description                                                                                                                                                   | Default value                                       | Required |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------- |
| `OAUTH2_KEYCLOAK_CLIENT_ID`               | Your Keycloak Client ID (as configured in the realm’s Clients)                                                                                                |                                                     |          |
| `OAUTH2_KEYCLOAK_CLIENT_SECRET`           | Your Keycloak Client secret                                                                                                                                   |                                                     |          |
| `OAUTH2_KEYCLOAK_REDIRECT_URI`            | The callback URI you registered in Keycloak for this application                                                                                              | `{POWERUPTIME_HOST}/api/login/oauth2/code/keycloak` |          |
| `OAUTH2_KEYCLOAK_AUTHORIZATION_URI`       | Used by your application to initiate the OAuth 2.0/OpenID Connect authorization code flow (e.g. `https://<host>/realms/<realm>/protocol/openid-connect/auth`) |                                                     |          |
| `OAUTH2_KEYCLOAK_ISSUER_URI`              | The issuer URI of your Keycloak realm (e.g. `https://<host>/realms/<realm>`)                                                                                  |                                                     |          |
| `OAUTH2_KEYCLOAK_JWK_SET_URI`             | The URL where Keycloak publishes its JSON Web Key Set (e.g. `https://<host>/realms/<realms>/protocol/openid-connect/certs`)                                   |                                                     |          |
| `OAUTH2_KEYCLOAK_TOKEN_URI`               | The endpoint in Keycloak’s OAuth 2.0 token service (e.g. `https://<host>/realms/<realm>/protocol/openid-connect/token`)                                       |                                                     |          |
| `OAUTH2_KEYCLOAK_USER_INFO_URI`           | The OpenID Connect UserInfo endpoint URL (e.g. `https://<host>/realms/<realm>/protocol/openid-connect/userinfo`)                                              |                                                     |          |
| `OAUTH2_KEYCLOAK_USER_NAME_ATTRIBUTE_URI` | The JWT claim or UserInfo field to treat as the principal’s username in your application                                                                      | `sub`                                               |          |

### Rate Limiting

| Name                             | Description                                                         | Default value | Required |
| -------------------------------- | ------------------------------------------------------------------- | ------------- | -------- |
| `RATE_LIMIT_ENABLED`             | Whether rate limiting is enabled.                                   | `true`        | x        |
| `RATE_LIMIT_DURATION_IN_SECONDS` | Duration, in seconds, of the rate limiting window.                  | `240`         | x        |
| `RATE_LIMIT_TRIES`               | Maximum number of requests allowed within the rate limiting window. | `40`          | x        |

### Performance

| Name                              | Description                                                                                   | Default value | Required |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ------------- | -------- |
| `APPRISE_WORKER_COUNT`            | Number of parallel worker processes Apprise will spawn to deliver notifications concurrently. | `-2`          | x        |
| `RABBIT_LISTENER_CONCURRENCY`     | Number of concurrent RabbitMQ listener instances.                                             | `16`          | x        |
| `RABBIT_LISTENER_MAX_CONCURRENCY` | Upper limit of the concurrent RabbitMQ listener instances.                                    | `16`          | x        |

### Development

| Name                         | Description                                                       | Default value | Required |
| ---------------------------- | ----------------------------------------------------------------- | ------------- | -------- |
| `PUSH_ENABLED`               | Whether push notifications are enabled.                           | `true`        | x        |
| `TEMP_NOTIFICATIONS_ENABLED` | Whether temporary notifications are enabled for testing purposes. | `false`       | x        |
| `SWAGGER_ENABLED`            | Whether the Swagger/OpenAPI documentation interface is enabled.   | `false`       | x        |
| `LOG_LEVEL`                  | Log Level of application                                          | `ERROR`       | x        |

## Good to know

## Container Registries

|                               GitHub Registry                                |                           Docker Hub                           |
| :--------------------------------------------------------------------------: | :------------------------------------------------------------: |
|     [Web](https://github.com/poweruptime/poweruptime/pkgs/container/web)     |     [Web](https://hub.docker.com/r/dafnik/poweruptime-web)     |
| [Backend](https://github.com/poweruptime/poweruptime/pkgs/container/backend) | [Backend](https://hub.docker.com/r/dafnik/poweruptime-backend) |

### Get merged docker compose config

```shell
docker compose -f _base.yml -f local.yml --env-file .env config
```

```shell
./pu config
```

Will print the merged config of [\_base.yml](_base.yml) and [local.yml](local.yml) file to
standard out.

### Use a specific version for local testing

Go to the [versions.env](versions.env) file, and change the version you need.

### Running locally

Simply use the IntelliJ `Local` run configuration or run the following command to start the whole stack locally:

```shell
./pu up --local
```

- Web interface: [http://localhost/](http://localhost/)
- API: [http://localhost/api](http://localhost/api)
- Traefik dashboard: [http://localhost/traefik](http://localhost/traefik)
- RabbitMQ Management: [http://localhost/rabbit/](http://localhost/rabbit/)
  - Username: `poweruptime`
  - Password: `poweruptime`
