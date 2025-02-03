package org.poweruptime.backend.core.utils

import java.time.format.DateTimeFormatter

object DateTimeUtils {
    const val FORMAT = "yyyy-MM-dd HH:mm:ss.SSS z (Z)"
    private const val SIMPLE_FORMAT = "yyyy-MM-dd HH:mm:ss z"

    val dateTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern(FORMAT)

    val simpleDateTimeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern(SIMPLE_FORMAT)
}
