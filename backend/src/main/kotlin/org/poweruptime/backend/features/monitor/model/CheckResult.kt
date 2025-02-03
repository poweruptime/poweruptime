package org.poweruptime.backend.features.monitor.model

import jakarta.persistence.*
import org.hibernate.annotations.ColumnDefault
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.features.notification.model.Notification
import java.time.Instant

@Entity
@Table(name = "check_result")
class CheckResult(
    /**
     * Usage of `MonitorStatusDatabaseConverter` to minify enum to 1 char
     * @see MonitorStatusDatabaseConverter
     */
    @ColumnDefault("'$MONITOR_STATUS_PENDING'")
    @Column(name = "status", nullable = false, length = 1)
    var status: MonitorStatus = MonitorStatus.PENDING,

    @JoinColumn(name = "monitor_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val monitor: Monitor,

    @Column(name = "times_retried", columnDefinition = "bigint")
    var timesRetried: Long? = null,

    /**
     * Usage of `MonitorStatusDatabaseConverter` to minify enum to 1 char
     * @see MonitorStatusDatabaseConverter
     */
    @Column(name = "previous_status", nullable = true, length = 1)
    var previousStatus: MonitorStatus? = null,

    @Column(name = "picked_up_at", columnDefinition = "timestamptz", nullable = true)
    var pickedUpAt: Instant? = null,

    @Column(name = "checked_at", columnDefinition = "timestamptz", nullable = true)
    var checkedAt: Instant? = null,

    @Column(name = "ping", nullable = true)
    var pingMs: Long? = null,

    @Column(name = "title", nullable = true, length = Database.MAX_TITLE_LENGTH)
    var title: String? = null,

    @Column(name = "message", nullable = true, length = Database.MAX_MESSAGE_LENGTH)
    var message: String? = null,

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "checkResult")
    var notification: List<Notification> = ArrayList(),
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String

    companion object
}
