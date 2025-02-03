package org.poweruptime.backend.features.authentication.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.OneToMany
import jakarta.persistence.Table
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH

@Table(name = "session")
@Entity
class Session(
    @Column(nullable = false, length = Database.MAX_SESSION_DESCRIPTION_LENGTH)
    var description: String,

    @JoinColumn(name = "user_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var user: User,

    @ColumnDefault("true")
    @Column(nullable = false, columnDefinition = "boolean")
    var valid: Boolean = true,

    @OneToMany(mappedBy = "session")
    val tokens: List<RefreshToken> = emptyList(),
) : AEntity() {
    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String
}

@Table(name = "refresh_token")
@Entity
class RefreshToken(
    @Column(nullable = false, unique = true, length = Database.MAX_REFRESH_TOKEN_LENGTH)
    val token: String,

    @JoinColumn(name = "session_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val session: Session,

    @ColumnDefault("true")
    @Column(nullable = false, columnDefinition = "boolean")
    val valid: Boolean = true,
) : AEntity() {
    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String
}
