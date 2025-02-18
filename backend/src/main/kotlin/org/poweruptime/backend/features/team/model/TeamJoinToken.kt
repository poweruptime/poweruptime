package org.poweruptime.backend.features.team.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.features.authentication.model.User

@Entity
@Table(name = "team_join_token")
class TeamJoinToken(
    @Column(name = "token", nullable = false, length = Database.MAX_TEAM_JOIN_TOKEN_LENGTH, unique = true)
    val token: String,

    @JoinColumn(name = "invitee_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var invitee: User,

    @JoinColumn(name = "inviter_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var inviter: User,

    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var team: Team,

    /**
     * Usage of UserTeamRoleConverter to minify enum to 1 char
     * @see TeamRoleDatabaseConverter
     */
    @Column(name = "role", nullable = false, length = 1)
    var role: TeamRole = TeamRole.MEMBER,

) : AEntity() {
    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String
}
