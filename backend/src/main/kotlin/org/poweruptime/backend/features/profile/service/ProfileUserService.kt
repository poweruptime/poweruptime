package org.poweruptime.backend.features.profile.service

import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.authentication.model.rowToUserRecord
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class ProfileUserService {
    @Transactional
    fun updateEmail(id: ULong, email: String): UserRecord = User.update({ User.id eq id }) {
        it[User.email] = email
    }.let {
        User.selectAll().where { User.id eq id }.limit(1).firstOrNull()?.let {
            User.rowToUserRecord(it)
        }.orThrowNotFound()
    }
}
