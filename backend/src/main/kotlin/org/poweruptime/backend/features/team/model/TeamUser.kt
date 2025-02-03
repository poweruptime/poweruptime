package org.poweruptime.backend.features.team.model

import jakarta.persistence.*
import org.hibernate.Hibernate
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.models.Timestamps
import org.poweruptime.backend.features.authentication.model.User
import java.io.Serializable
import java.time.Instant
import java.util.*

@Embeddable
data class TeamUserId(
    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var team: Team,

    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "id")
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var user: User,
) : Serializable

@Entity
@Table(
    name = "team_user",
    uniqueConstraints = [UniqueConstraint(columnNames = ["team_id", "user_id"])],
)
class TeamUser(
    @EmbeddedId
    var id: TeamUserId,

    /**
     * Usage of UserTeamRoleConverter to minify enum to 1 char
     * @see TeamRoleDatabaseConverter
     */
    @Column(name = "role", nullable = false, length = 1)
    var role: TeamRole = TeamRole.MEMBER,

    @JoinColumn(name = "inviter_id", nullable = true)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var invitedBy: User? = null,

    @ColumnDefault("0")
    @Version
    var version: Long = 0,

) : Timestamps() {
    override fun hashCode(): Int {
        return Objects.hash(id)
    }

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other == null || Hibernate.getClass(this) != Hibernate.getClass(other)) return false
        other as TeamUser

        return id == other.id
    }

    /**
     * Update an entity without changing its data
     */
    fun touch() {
        updatedAt = Instant.now()
    }

    override fun toString(): String {
        return """Id: "$id""""
    }
}
