package org.poweruptime.backend.features.profile.service

import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ProfileUserService {
    @Transactional
    fun updateEmail(id: ULong, email: String): UserRecord = UserTable.update({ UserTable.id eq id }) {
        it[UserTable.email] = email
    }.let {
        UserTable.selectAll().where { UserTable.id eq id }.limit(1).firstOrNull()?.let {
            UserTable.rowToUserRecord(it)
        }.orThrowNotFound()
    }
}
