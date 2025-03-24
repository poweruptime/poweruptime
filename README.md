<p align="center">
    <img alt="poweruptime Logo" src="https://avatars.githubusercontent.com/u/166804466?s=200&v=4" style="width:200px; border-radius: 15px;"/>
</p>
<h3 align="center">uptime monitoring tool</h3>

## Local development

### Backend

Install dependencies

```shell
./gradlew backend:bootJar
```

#### Using Spring run config

Use the `Server with dependencies` run configuration (or just `Server` if you started the docker dependencies manually).

To start the dependencies manually use the `Dependency Containers` run config or run

```shell
docker compose -f compose-local-dev.yml up
```

#### Containerized

Use the `Containerized` run config or run

```shell
./gradlew backend:build -x test -Pversion=local && docker compose -f compose-local-dev.yml -f compose-local.yml up --build
```

- Web interface: [http://localhost:3000/](http://localhost:3000/)
- API: [http://localhost/api](http://localhost/api)
- RabbitMQ Management: [http://localhost:15672/](http://localhost:15672/)
  - Username: `poweruptime`
  - Password: `poweruptime`

### Web

Install dependencies

```shell
pnpm install
```

#### Using ng serve

Use the `Web Start` run configuration.

Or via the terminal, run

```shell
pnpm web:start
```

## Create Builds/Docker images

It is not required to supply the `version` property. If not supplied you will be asked what to do.
You can than either increase major, minor or patch. For beta, you can also choose to keep the version
and just create a news build.

### Lava

```
./gradlew releaseBeta -Pversion=0.0.1
```

### Prod

```
./gradlew releaseProd -Pversion=0.0.1
```

## Get access token

```bash
curl -v -XPOST -H "Content-type: application/json" -d '{
"email": "admin@admin.org",
"password": "admin",
"sessionInformation": "CURL DEV",
"stayLoggedIn": "true"
}' 'http://localhost:8080/api/v1/auth/login' | jq
```
