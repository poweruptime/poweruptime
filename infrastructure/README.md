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

## Stop the stack

```shell
./stop.sh
```

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
