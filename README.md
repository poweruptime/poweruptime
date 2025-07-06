<p align="center">
    <img alt="poweruptime Logo" src="https://avatars.githubusercontent.com/u/166804466?s=200&v=4" style="width:200px; border-radius: 15px;"/>
</p>
<h3 align="center">uptime monitoring tool</h3>

## 🚀 Features

- Uptime monitoring for HTTP(s) / HTTP(s) Keyword / Ping / DNS Record / Push / SSL Certificates
- Multiple Users / Team(s) management
- Easy setup
- Fast & SEO friendly
- Notifications via E-Mail, Discord, Slack & Apprise
- 30-second intervals
- [Multi Languages](https://github.com/poweruptime/poweruptime/tree/main/web/src/assets/i18n)
- Multiple status pages with specific domain name support
- Detailed monitor analysis
- 2FA & OAuth2 support

## How to install

Checkout our [docker compose instructions](./infrastructure/README.md).

1. Clone the [docker-compose repository](https://github.com/poweruptime/docker-compose).
   ```shell
   git clone https://github.com/poweruptime/docker-compose.git poweruptime && cd ./poweruptime && chmod +x ./pu
   ```
2. Setup
   ```shell
   ./pu setup
   ```
3. Make sure no other services listen on port `80` and `443`.
4. Start the stack
   ```shell
   ./pu start
   ```

## How to update

Read more [here](./infrastructure/README.md).

## Contributing

Take a look at the [starter guide](.github/CONTRIBUTING.md).

## Motivation

- Long time user of [uptime-kuma](https://github.com/louislam/uptime-kuma) but not happy with the UX of Websockets.
- Always wanted to share my uptime monitoring instance with friends (so they can track their own services).
- Wanted to build something with [SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events).
- Wanted to try out a mono-repo with modern Angular and Kotlin Spring Boot.
