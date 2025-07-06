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
docker compose -f ./backend/compose-local-dev.yml up
```

#### Containerized

Use the `Containerized` run config or run

```shell
pnpm web:build && ./gradlew backend:build -x test -Pversion=local && docker compose -f ./backend/compose-local-dev.yml -f ./backend/compose-local.yml up --build
```

- Web interface: [http://localhost:4200/](http://localhost:4200/)
- API: [http://localhost/api](http://localhost/api)
- RabbitMQ Management: [http://localhost:15672/](http://localhost:15672/)
  - Username: `poweruptime`
  - Password: `poweruptime`

#### E-Mails

Learn more about adding E-Mails [here](../emails/README.md).

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

### Create Builds/Docker images

It is not required to provide the version property.
If omitted, you will be prompted to specify the desired version change: you can increment the major, minor, or patch version.
For beta releases, you also have the option to keep the existing version.

#### Beta

```
./gradlew releaseBeta -Pversion=0.0.1
```

#### Prod

```
./gradlew releaseProd -Pversion=0.0.1
```

### Get access token

```bash
curl -v -XPOST -H "Content-type: application/json" -d '{
"email": "admin@admin.org",
"password": "admin",
"sessionInformation": "CURL DEV",
"stayLoggedIn": "true"
}' 'http://localhost:8080/api/v1/auth/login' | jq
```
