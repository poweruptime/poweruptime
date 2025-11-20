package org.poweruptime.backend.features.authentication.model

import org.poweruptime.backend.core.models.HasModifiers
import org.poweruptime.backend.core.models.NanoIdTable
import org.poweruptime.backend.core.models.createdAt
import org.poweruptime.backend.core.models.updatedAt
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH

object PasswordResetToken : NanoIdTable("password_reset_token", NANO_ID_MAX_LENGTH), HasModifiers {
    override val createdAt = createdAt()
    override val updatedAt = updatedAt()

    val userId = ulong("user_id").references(User.id).index()
    val valid = bool("valid").clientDefault { true }
}
