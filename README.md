<p align="center">
    <img alt="poweruptime Logo" src="documentation/wr-square-rounded.png" style="width:200px; border-radius: 15px;"/>
</p>
<h1 align="center">poweruptime</h1>
Next-gen Uptime monitoring tool.

## ToDo
- [] 

## Local dev

### Using Spring run config

Use the `Server with dependencies` run configuration (or just `Server` if you started the dependencies manually).

To start the dependencies manually use the `Dependency Containers` run config or run

```shell
docker compose -f compose-local-dev.yml up
```

## Containerized

Use the `Containerized` run config or run

```shell
./gradlew backend:build -x test -Pversion=local && docker compose -f compose-local-dev.yml -f compose-local.yml up --build
```

- Web interface: [http://localhost:3000/](http://localhost:3000/)
- API: [http://localhost/api](http://localhost/api)
- RabbitMQ Management: [http://localhost:15672/](http://localhost:15672/)
    - Username: `poweruptime`
    - Password: `poweruptime`

## Create Builds/Docker images

It is not required to supply the `version` property. If not supplied you will be asked what to do.
You can than either increase major, minor or patch. For lava, you can also choose to keep the version 
and just create a news build.

### Lava

```
./gradlew releaseLava -Pversion=3.1.1
```

### Prod

```
./gradlew releaseProd -Pversion=3.1.1
```

## Get access token

```bash 
curl -v -XPOST -H "Content-type: application/json" -d '{
"email": "admin@admin.org",
"password": "admin",
"sessionInformation": "Postman DEV",
"stayLoggedIn": "true"
}' 'http://localhost:8080/api/v1/auth/login' | jq
```

## Adding environment variable

When adding an environment variable do not forget to also add it to the infrastructure repository right away.
Follow
the [guide](https://github.com/poweruptime/infra?tab=readme-ov-file#add-environment-variable)
given in the infrastructure repository.