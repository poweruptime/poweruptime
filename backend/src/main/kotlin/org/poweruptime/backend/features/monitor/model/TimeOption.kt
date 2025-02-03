package org.poweruptime.backend.features.monitor.model

enum class TimeOption(val hours: Long) {
    ONE_HOUR(1),
    THREE_HOURS(3),
    SIX_HOURS(6),
    TWELVE_HOURS(12),
    ONE_DAY(24),
    THREE_DAYS(24 * 3),
    ONE_WEEK(24 * 7),
    TWO_WEEKS(24 * 7 * 2),
    ONE_MONTH(24 * 31),
    THREE_MONTHS(24 * 31 * 3),
    SIX_MONTHS(24 * 31 * 6),
    ONE_YEAR(24 * 31 * 12),
}
