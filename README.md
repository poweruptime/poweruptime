<p align="center">
    <img alt="poweruptime Logo" src="https://avatars.githubusercontent.com/u/166804466?s=200&v=4" style="width:200px; border-radius: 15px;"/>
</p>
<h3 align="center">Self‑hosted uptime monitoring tool for teams and individuals</h3>

> [!WARNING]
> ⚠️ The project is in **alpha** and under **very active** development.  
> ⚠️ Expect bugs and breaking changes.  
> ⚠️ **Do not rely on this as your sole monitoring solution.**

## 🚀 Features

- Uptime monitoring for HTTP(s) / HTTP(s) Keyword / Ping / DNS Record / Push / SSL Certificates
- Multi-user / Team management
- Email, Discord, Slack & Apprise notifications
- Fast setup & SEO‑friendly
- 30-second monitoring intervals
- [Multi-language support](https://github.com/poweruptime/poweruptime/tree/main/web/src/assets/i18n)
- Multiple status pages with custom domains
- In-depth monitor analytics
- 2FA & OAuth2 authentication

| ![Team dashboard](./.github/screenshots/team_dashboard.webp) | ![Monitor info](./.github/screenshots/monitor_info.webp) | ![Monitor settings](./.github/screenshots/monitor_settings.webp) |
| :----------------------------------------------------------: | :------------------------------------------------------: | :--------------------------------------------------------------: |

## Installation

poweruptime can be self‑hosted with Docker Compose.

Checkout our [docker compose instructions](./infrastructure/README.md).

1. Clone the [docker-compose repository](https://github.com/poweruptime/docker-compose):
   ```shell
   git clone https://github.com/poweruptime/docker-compose.git poweruptime && cd ./poweruptime && chmod +x ./pu
   ```
2. Run setup:
   ```shell
   ./pu setup
   ```
3. Ensure no other services are running on ports `80` or `443`.
4. Start the stack:
   ```shell
   ./pu start
   ```

## How to update

Follow the update instructions [here](./infrastructure/README.md).

## Screenshots

|   ![Team dashboard](./.github/screenshots/team_dashboard.webp)   |          ![Monitor info](./.github/screenshots/monitor_info.webp)          |    ![Monitor info 2](./.github/screenshots/monitor_info_2.webp)    |
| :--------------------------------------------------------------: | :------------------------------------------------------------------------: | :----------------------------------------------------------------: |
|   ![Monitor edit](./.github/screenshots/monitor_settings.webp)   | ![Monitor notifications](./.github/screenshots/monitor_notifications.webp) |  ![Status page edit](./.github/screenshots/status_page_edit.webp)  |
|            ![Teams](./.github/screenshots/teams.webp)            |         ![Team settings](./.github/screenshots/team_settings.webp)         | ![Instance settings](./.github/screenshots/instance_settings.webp) |
| ![Profile settings](./.github/screenshots/profile_settings.webp) |                                                                            |                                                                    |

## Contributing to the project

We welcome all contributions!

Please check [DEVELOPER.md](/.github/DEVELOPER.md) for documentation on running the project locally and [CONTRIBUTING.md](/.github/CONTRIBUTING.md) for contribution guidelines.

## Motivation

- Long-time usage of [uptime-kuma](https://github.com/louislam/uptime-kuma) but wanted a more scalable, modern architecture.
- Desire to share uptime monitoring with friends or teams — each managing their own services.
- Interest in exploring Server-Sent Events ([SSE](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)) instead of WebSockets for simplicity and performance.
- Building a full‑stack monorepo combining Angular and Kotlin Spring Boot.
