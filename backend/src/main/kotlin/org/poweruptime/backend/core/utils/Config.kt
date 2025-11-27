package org.poweruptime.backend.core.utils

object Config {
    const val RATE_LIMIT_ENABLED = "\${poweruptime.rate-limit.enabled}"
    const val RATE_LIMIT_DURATION_IN_SECONDS = "\${poweruptime.rate-limit.duration-in-seconds}"
    const val RATE_LIMIT_TRIES = "\${poweruptime.rate-limit.tries}"

    const val DATASOURCE_DRIVER_CLASS_NAME = "\${spring.datasource.driver-class-name}"
    const val DATASOURCE_URL = "\${spring.datasource.url}"
    const val DATASOURCE_USERNAME = "\${spring.datasource.username}"
    const val DATASOURCE_PASSWORD = "\${spring.datasource.password}"

    const val HOST = "\${poweruptime.host}"
    const val NOTIFICATION_TEMP_ENABLED = "\${poweruptime.notification-temp.enabled}"
    const val MONITOR_AUTOSTART_ENABLED = "\${poweruptime.monitor-autostart.enabled}"
    const val MAIL_ENABLED = "\${poweruptime.mail.enabled}"
    const val MAIL_HOST = "\${spring.mail.host}"
    const val MAIL_PORT = "\${spring.mail.port}"
    const val MAIL_USERNAME = "\${spring.mail.username}"
    const val MAIL_PASSWORD = "\${spring.mail.password}"
    const val MAIL_SECURITY = "\${poweruptime.mail.security}"
    const val MAIL_IGNORE_TLS_ERRORS = "\${poweruptime.mail.ignore-tls-errors}"

    const val APPRISE_URL = "\${poweruptime.apprise.url}"

    const val STORAGE_DIRECTORY = "\${poweruptime.storage.directory}"

    const val KEY_DIRECTORY = "\${poweruptime.keys.directory}"
    const val KEY_ACCESS_TOKEN_PRIVATE = "\${poweruptime.keys.access-token.private}"
    const val KEY_ACCESS_TOKEN_PUBLIC = "\${poweruptime.keys.access-token.public}"
    const val KEY_REFRESH_TOKEN_PRIVATE = "\${poweruptime.keys.refresh-token.private}"
    const val KEY_REFRESH_TOKEN_PUBLIC = "\${poweruptime.keys.refresh-token.public}"

    const val PUSH_ENABLED = "\${poweruptime.push.enabled}"

    const val DATABASE_DDL_AUTO = "\${poweruptime.database.ddl-auto}"
}
