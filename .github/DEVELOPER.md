# Building and Testing poweruptime

This document describes how to set up your development environment to build and test poweruptime.

See the [contribution guidelines](CONTRIBUTING.md) if you'd like to contribute to poweruptime.

## Prerequisite Software

- **[Node](https://nodejs.org/en)** and **Java ([Amazon Corretto](https://aws.amazon.com/corretto/))**
- **pnpm** — for frontend dependency management
- **gradle** — for backend dependency management and bulding
- **Docker** — for containerized backend, database, and message queue

## Project Structure

The complete code resides in this repository.
The infrastructure folder is mirrored into the [docker-compose](https://github.com/poweruptime/docker-compose) repository.

- `/backend` - the Kotlin Spring Boot app
- `/web` - The Angular frontend app
- `/emails` - The React Email app (used by the backend)
- `/infrastructure` - Docker-Compose setup configs

## Backend

### 1. Build Dependencies

To build the backend JAR and resolve all dependencies:

```shell
./gradlew backend:bootJar
```

### 2. Running the Backend

You have two main options for running the backend:

**(a)** via Spring run configurations, or **(b)** via Docker containers.

#### Option A — Using Spring Run Config

Use the **`Server with dependencies`** run configuration (recommended).

If you’ve already started the Docker dependencies manually, you can also use **`Server`**.

To start only the dependency services use the **`Dependency Containers`** run config or run:

```shell
docker compose -f compose-dev.yml up
```

#### Option B — Containerized Setup

Run everything (backend + web + dependencies) in containers.

Use the `Containerized` run config or run:

```shell
pnpm web:build && \
./gradlew backend:build -x test -Pversion=local && \
docker compose -f compose-dev.yml -f ./backend/compose.yml up --build
```

**Available services:**

| Service                | URL                                                | Notes                                             |
| ---------------------- | -------------------------------------------------- | ------------------------------------------------- |
| Web Interface          | [http://localhost:4200/](http://localhost:4200/)   | Web app                                           |
| API                    | [http://localhost/api](http://localhost/api)       | Backend API                                       |
| RabbitMQ Management UI | [http://localhost:15672/](http://localhost:15672/) | Username: `poweruptime` • Password: `poweruptime` |
| Apprise                | [http://localhost:8000/](http://localhost:8000/)   | Stateless                                         |

### 3. E-Mail Setup

For setting up and customizing email templates, check [Emails README](../emails/README.md).

## Web

### 1. Install Dependencies

```shell
pnpm install
```

### 2. Run in Development Mode

You can use your IDE run configuration **`Web Start`** or run it manually:

```shell
pnpm web:start
```

This launches the web app at [http://localhost:4200](http://localhost:4200).

## Building & Releasing

poweruptime follows a versioned release system.  
You can release Docker images or production bundles using Gradle.

> The `-Pversion` flag is **optional**.  
> If omitted, you’ll be asked whether to bump `major`, `minor`, or `patch` version.  
> For beta releases, you can keep the existing version tag.

### 🔸 Beta Build

```shell
./gradlew releaseBeta -Pversion=0.0.1
```

### 🔹 Production Build

```shell
./gradlew releaseProd -Pversion=0.0.1
```

## Get Access Token (via cURL)

If you need an authentication token for local testing, run:

```shell
curl -v -XPOST -H "Content-Type: application/json" -d '{
  "email": "admin@admin.org",
  "password": "admin",
  "sessionInformation": "CURL DEV",
  "stayLoggedIn": true
}' 'http://localhost:8080/api/v1/auth/login' | jq
```

## Code Formatting (& linting)

We use [Prettier](https://prettier.io/) and [detekt](https://detekt.dev/) to automatically enforce code formatting for most of the files we have. Additionally we use [eslint](https://eslint.org/) to lint the (Angular) web app.

This allows us to focus on code reviews and features, and not on style nit-picking.

**We enforce formatting during [CI](/.github/workflows/ci.yml) with:**

```shell
pnpm format:check && ./gradlew detekt
```

**You can also force format the code with:**

```shell
pnpm detekt
```

## Commit messages

We use [CommitLint](https://commitlint.js.org/) [config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional) to enforce commit messages and have a clean git history. Commit format will be enforced with during [CI](/.github/workflows/ci.yml).

Here is an example of the commit message that provides a title, an explanation and references a GitHub issue:

```text
fix(web): createdAt relative time table width

createdAt column width was too short resulting in a broken table view

Fixes #1234
```

More examples:

- `feat: ...` → a new feature
- `fix: ...` → a bug fix j
- `docs: ...` → a documentation update
- `refactor: ...` → an internal refactoring without public functionality changes
- `feat(backend): ...` → a new feature for the backend
- `fix(backend): ...` → a bug fix for the backend
- `test(backend): ...` → an update to one of the backend unit or e2e tests
- `docs(backend): ...` → a backend documentation update
- `refactor(backend): ...` → an internal backend refactoring without public functionality changes
- `build: ...` → any change for the utility scripts, configurations, dependencies, etc.
- `ci: ...` → any change for CI related configuration
- `revert: ...` → revert an older commit

Anything else won't pass validation.
