package org.poweruptime.backend.features.notification.model

import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.model.Team

@Entity
@Table(name = "notification_method")
class NotificationMethod(
    @Column(nullable = false, length = Database.MAX_NAME_LENGTH)
    override var name: String,

    @JoinColumn(name = "notification_method_data_id", nullable = false)
    @OneToOne(fetch = FetchType.EAGER)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var data: NotificationMethodData,

    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var team: Team,

    @ColumnDefault("false")
    @Column(name = "used_by_default", nullable = false, columnDefinition = "boolean")
    var useByDefault: Boolean = false,

    @Column(name = "title_template", nullable = true, columnDefinition = "text")
    var titleTemplate: String? = null,

    @Column(name = "body_template", nullable = true, columnDefinition = "text")
    var bodyTemplate: String? = null,

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "monitor_notification_method",
        joinColumns = [JoinColumn(name = "notification_method_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "monitor_id", referencedColumnName = "id")],
    )
    var usedByMonitors: List<Monitor> = ArrayList(),
) : ASoftDeleteEntity(), EntityWithName {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    companion object
}
