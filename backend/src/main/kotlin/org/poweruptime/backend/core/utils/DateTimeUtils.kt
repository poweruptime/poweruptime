package org.poweruptime.backend.core.utils

import java.time.format.DateTimeFormatter

object DateTimeUtils {
    const val FORMAT = "yyyy-MM-dd HH:mm:ss.SSS z (Z)"
    private const val SIMPLE_FORMAT = "yyyy-MM-dd HH:mm:ss z"

    val dateTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern(FORMAT)

    val simpleDateTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern(SIMPLE_FORMAT)
}

const val DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"

const val MILLI_SECONDS_PER_MINUTE = 60_000
const val MILLI_SECONDS_PER_SECONDS = 1_000
const val SECONDS_PER_DAY = 86400L
const val HOURS_PER_DAY = 24
const val DAYS_PER_MONTH = 31
const val DAYS_PER_YEAR = 365
