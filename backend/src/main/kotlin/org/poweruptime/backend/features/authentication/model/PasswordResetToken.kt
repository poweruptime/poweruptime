package org.poweruptime.backend.features.authentication.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH

@Entity
@Table(name = "password_reset_token")
class PasswordResetToken(
    @JoinColumn(name = "user_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var user: User,
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
