package org.poweruptime.backend.core.utils

object Database {
    const val MIN_NAME_LENGTH = 2
    const val MAX_NAME_LENGTH = 70
    const val MIN_MAIL_LENGTH = 5
    const val MAX_MAIL_LENGTH = 255

    const val MIN_FILE_NAME_LENGTH = 1
    const val MAX_FILE_NAME_LENGTH = 256

    const val MIN_TEST_INTERVAL_SECONDS = 30L // 30 seconds
    const val MAX_TEST_INTERVAL_SECONDS = 94608000L // 3 years

    const val MAX_SESSION_DESCRIPTION_LENGTH = 60
    const val MAX_REFRESH_TOKEN_LENGTH = 1020
    const val MAX_TEAM_JOIN_TOKEN_LENGTH = 20

    const val MIN_PASSWORD_LENGTH = 6

    const val MIN_SLUG_LENGTH = 1
    const val MAX_SLUG_LENGTH = 255

    const val SLUG_REGEX = """^[a-z0-9]+(?:-[a-z0-9]+)*$"""

    const val MIN_URL_LENGTH = 1
    const val MAX_URL_LENGTH = 2048

    const val MIN_PUSH_ID_LENGTH = NANO_ID_SMALL_LENGTH
    const val MAX_PUSH_ID_LENGTH = NANO_ID_SMALL_LENGTH

    const val MAX_BASIC_AUTH_LENGTH = 512

    const val MIN_VALID_DAYS_LEFT = 1L
    const val MAX_VALID_DAYS_LEFT = 3650L // 4 years

    const val MAX_TITLE_LENGTH = 2000
    const val MAX_MESSAGE_LENGTH = 4000

    const val MIN_DISCORD_DISPLAY_NAME_LENGTH = 1
    const val MAX_DISCORD_DISPLAY_NAME_LENGTH = 32

    const val URL_REGEX = """^(https?|ftp|file)://[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]"""

    @Suppress("MaxLineLength")
    const val DOMAIN_REGEX = """(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]"""
    const val MIN_DOMAIN_LENGTH = 1
    const val MAX_DOMAIN_LENGTH = 253

    @Suppress("MaxLineLength")
    const val IPV4_REGEX = """^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$"""
    const val MIN_IPV4_LENGTH = 1
    const val MAX_IPV4_LENGTH = 15

    const val MIN_PORT = 1L
    const val MAX_PORT = 65535L
}
