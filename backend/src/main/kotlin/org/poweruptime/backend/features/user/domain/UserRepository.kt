package org.poweruptime.backend.features.user.domain

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.eq
import org.jetbrains.exposed.v1.core.SqlExpressionBuilder.like
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable

fun UserTable.findByEmail(email: String): UserRecord? =
    selectAll().where { UserTable.email eq email }.limit(1).firstOrNull()?.let {
        UserTable.rowToUserRecord(it)
    }

fun UserTable.findByRole(role: SystemRole): List<UserRecord> =
    selectAll().where { UserTable.role eq role }.map { UserTable.rowToUserRecord(it) }

fun UserTable.isSetup(): Boolean = selectAll().count() == 0L

fun UserTable.findAll(
    pageable: Pageable,
    search: String?,
    activated: Boolean?,
    role: SystemRole?,
    deleted: Boolean = false
): Page<UserRecord> {
    var condition: Op<Boolean> = UserTable.deleted.deletedFilter(deleted)

    search?.let {
        val searchExpr =
            (UserTable.name.lowerCase() like "%${it.lowercase()}%") or
                (UserTable.email.lowerCase() like "%${it.lowercase()}%")
        condition = condition and searchExpr
    }

    activated?.let {
        condition = condition and (UserTable.activated eq it)
    }

    role?.let {
        condition = condition and (UserTable.role eq it)
    }

    val query = selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> UserTable.name
                "activated" -> UserTable.activated
                "role" -> UserTable.role
                "createdAt" -> UserTable.createdAt
                else -> throw BadRequestException(
                    """Sort parameter "$it" not found""",
                )
            }
        },
        map = { rowToUserRecord(it) },
    )
}
