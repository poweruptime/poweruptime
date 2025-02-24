package org.poweruptime.backend.features.authentication.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import org.hibernate.annotations.ColumnDefault
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.team.model.Team
import org.poweruptime.backend.features.team.model.TeamJoinToken
import org.poweruptime.backend.features.team.model.TeamUser

@Entity
// \" is needed as tables are not allowed to be called user in Postgres
@Table(name = "\"user\"")
class User(
    /**
     * Google recommends 70 for combined input fields (firstname + surname)
     */
    @Column(nullable = false, length = Database.MAX_NAME_LENGTH)
    var name: String,

    /**
     * Email addresses are allowed to have 254 chars maximal
     */
    @Column(nullable = false, unique = true, length = Database.MAX_MAIL_LENGTH)
    var email: String,

    @Column(name = "password_hash", nullable = false, length = 80)
    var passwordHash: String,

    @ColumnDefault("true")
    @Column(nullable = false, columnDefinition = "boolean")
    var activated: Boolean = true,

    @ColumnDefault("false")
    @Column(name = "force_password_change", nullable = false, columnDefinition = "boolean")
    var forcePasswordChange: Boolean = false,

    /**
     * Usage of UserGlobalRoleConverter to minify enum to 1 char
     */
    @Column(nullable = false, length = 1)
    var role: SystemRole = SystemRole.USER,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personal_team_id", nullable = false)
    val personalTeam: Team,

    @OneToOne(fetch = FetchType.LAZY, mappedBy = "user", cascade = [CascadeType.REMOVE], orphanRemoval = true)
    var mfa: MFA? = null,

    @OneToMany(mappedBy = "invitee", fetch = FetchType.LAZY)
    var invitedTo: List<TeamJoinToken> = ArrayList(),

    @OneToMany(mappedBy = "inviter", fetch = FetchType.LAZY)
    var invitedUsers: List<TeamJoinToken> = ArrayList(),

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    var passwordResetToken: List<PasswordResetToken> = ArrayList(),

    @OneToMany(mappedBy = "invitedBy", fetch = FetchType.LAZY)
    var teamUsersInvited: List<TeamUser> = ArrayList(),

    @OneToMany(mappedBy = "id.user", fetch = FetchType.LAZY)
    var teamUsers: List<TeamUser> = ArrayList(),

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    var sessions: List<Session> = ArrayList(),
) : AEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    fun isAdmin(): Boolean = role == SystemRole.ADMIN

    override fun toString(): String = "Id: '$id', Name: '$name', Email: '$email', role: '$role'"

    companion object
}
