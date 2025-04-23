package org.poweruptime.backend.features.monitor.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.models.EntityWithName
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.monitor.core.MonitorCheckerData
import org.poweruptime.backend.features.notification.model.NotificationMethod
import org.poweruptime.backend.features.statusPage.model.StatusPageGroupMonitor
import org.poweruptime.backend.features.team.model.Team

@Entity
@Table(name = "monitor")
class Monitor(
    @Column(nullable = false, length = Database.MAX_NAME_LENGTH)
    override var name: String,

    @Column(name = "test_interval_seconds", nullable = false, columnDefinition = "bigint")
    var testIntervalSeconds: Long,

    @Column(name = "upside_down", nullable = false, columnDefinition = "boolean")
    var upsideDown: Boolean,

    @JoinColumn(name = "team_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var team: Team,

    @JoinColumn(name = "monitor_checker_id", nullable = false)
    @OneToOne(fetch = FetchType.EAGER)
    var checker: MonitorCheckerData,

    @Column(name = "retries", nullable = false, columnDefinition = "bigint")
    var retries: Long? = null,

    @Column(name = "resend_after", nullable = true, columnDefinition = "bigint")
    var resendAfter: Long? = null,

    @Column(name = "description", nullable = true, columnDefinition = "text")
    var description: String? = null,

    /**
     * Usage of `MonitorStatusDatabaseConverter` to minify enum to 1 char
     * @see MonitorStatusDatabaseConverter
     */
    @Column(name = "status", nullable = false, length = 1)
    var status: MonitorStatus = MonitorStatus.PENDING,

    @OneToMany(mappedBy = "monitor")
    var checkResults: List<CheckResult> = ArrayList(),

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "monitor_notification_method",
        joinColumns = [JoinColumn(name = "monitor_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "notification_method_id", referencedColumnName = "id")],
    )
    var enabledNotificationMethods: List<NotificationMethod> = ArrayList(),

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "monitor_tag",
        joinColumns = [JoinColumn(name = "monitor_id", referencedColumnName = "id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id", referencedColumnName = "id")],
    )
    var selectedTags: List<Monitor> = ArrayList(),

    @OneToMany(mappedBy = "connection.monitor")
    var groupMonitors: List<StatusPageGroupMonitor> = ArrayList(),
) : ASoftDeleteEntity(), EntityWithName {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    companion object
}
