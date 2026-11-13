---
'poweruptime': patch
---

Upgrade the bundled PostgreSQL service to version 18 and Apprise to version 2. Existing PostgreSQL installations must migrate their data before upgrading; see [Upgrading PostgreSQL](https://github.com/poweruptime/poweruptime/blob/main/infrastructure/README.md#upgrading-postgresql).

Keep check results fresh across live updates and include recent dependency and runtime updates.

Use Changesets to prepare releases, with one changelog for both channels and beta versions such as `0.6.1-beta.0`. Existing timestamp-based beta versions remain supported by the update checker.
