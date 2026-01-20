package org.poweruptime.backend.features.user.domain

import org.jetbrains.exposed.v1.core.Op
import org.jetbrains.exposed.v1.core.and
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.core.like
import org.jetbrains.exposed.v1.core.lowerCase
import org.jetbrains.exposed.v1.core.or
import org.jetbrains.exposed.v1.jdbc.select
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.Page
import org.poweruptime.backend.core.domain.deletedFilter
import org.poweruptime.backend.core.domain.pageQuery
import org.poweruptime.backend.core.dto.Pageable
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord

fun User.findByEmail(email: String): UserRecord? =
    selectAll().where { User.email eq email }.limit(1).firstOrNull()?.let {
        User.rowToUserRecord(it)
    }

fun User.existsByEmail(email: String): Boolean = select(id).where { User.email eq email }.limit(1).count() > 0

fun User.findByRole(role: SystemRole): List<UserRecord> =
    selectAll().where { User.role eq role }.map { rowToUserRecord(it) }

fun User.isSetup(): Boolean = selectAll().count() == 0L

fun User.findAll(
    pageable: Pageable,
    search: String?,
    activated: Boolean?,
    role: SystemRole?,
    deleted: Boolean = false,
): Page<UserRecord> {
    var condition: Op<Boolean> = User.deleted.deletedFilter(deleted)

    search?.let {
        val searchExpr =
            (User.name.lowerCase() like "%${it.lowercase()}%") or
                (User.email.lowerCase() like "%${it.lowercase()}%")
        condition = condition and searchExpr
    }

    activated?.let {
        condition = condition and (User.activated eq it)
    }

    role?.let {
        condition = condition and (User.role eq it)
    }

    val query = selectAll().where(condition)

    return pageQuery(
        query,
        pageable,
        sort = {
            when (it) {
                "name" -> User.name
                "activated" -> User.activated
                "role" -> User.role
                "createdAt" -> User.createdAt
                else -> throw BadRequestException(
                    """Sort parameter "$it" not found""",
                )
            }
        },
        map = { rowToUserRecord(it) },
    )
}
