package org.poweruptime.backend.core

import me.dafnik.JpaSpecificationBuilder.LogicalBuilder

fun <T> LogicalBuilder<T>.colDeleted(
    deleted: Boolean,
    columnName: String = "deleted"
) {
    if (deleted) {
        col(columnName).notNull()
    } else {
        col(columnName).isNull()
    }
}
