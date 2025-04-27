package org.poweruptime.backend.features.profile.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.authentication.model.User

@Entity
@Table(name = "email_change_token")
class EmailChangeToken(
    @Column(name = "email", nullable = false, length = Database.MAX_MAIL_LENGTH)
    val email: String,

    @JoinColumn(name = "user_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var user: User,

    @Column(name = "old_email", nullable = false, length = Database.MAX_MAIL_LENGTH)
    val oldEmail: String = user.email,
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
