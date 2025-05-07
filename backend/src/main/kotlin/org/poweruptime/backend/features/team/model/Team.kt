package org.poweruptime.backend.features.team.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import org.hibernate.annotations.SQLRestriction
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.statusPage.model.StatusPage
import org.poweruptime.backend.features.tag.Tag

@Entity
@Table(name = "team")
class Team(
    @Column(nullable = false, length = Database.MAX_NAME_LENGTH)
    override var name: String,

    @SQLRestriction("deleted IS null")
    @OneToMany(mappedBy = "team")
    var monitors: List<Monitor> = ArrayList(),

    @SQLRestriction("deleted IS null")
    @OneToMany(mappedBy = "team")
    var statusPages: List<StatusPage> = ArrayList(),

    @OneToOne(mappedBy = "personalTeam", fetch = FetchType.LAZY)
    var personalUser: User? = null,

    @OneToMany(mappedBy = "id.team")
    var teamUsers: List<TeamUser> = ArrayList(),

    @SQLRestriction("deleted IS null")
    @OneToMany(mappedBy = "team")
    var notificationMethods: List<NotificationMethod> = ArrayList(),

    @OneToMany(mappedBy = "team")
    var teamSettings: List<TeamSetting> = ArrayList(),

    @SQLRestriction("deleted IS null")
    @OneToMany(mappedBy = "team")
    var tags: List<Tag> = ArrayList(),
) : ASoftDeleteEntity(), EntityWithName {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    companion object
}
