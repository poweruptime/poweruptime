package org.poweruptime.backend.features.tag

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.model.Team

@Entity
@Table(name = "tag")
class Tag(
    @Column(nullable = false, length = Database.MAX_NAME_LENGTH)
    override var name: String,

    @Column(nullable = true, length = Database.HEX_COLOR_LENGTH)
    var hexColor: String? = null,

    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var team: Team,

    @ManyToMany
    @JoinTable(
        name = "monitor_tag",
        joinColumns = [JoinColumn(name = "tag_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "monitor_id", referencedColumnName = "id")],
    )
    var usedByMonitors: List<Monitor> = ArrayList(),

) : ASoftDeleteEntity(), EntityWithName {
    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String

    companion object
}
