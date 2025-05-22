package org.poweruptime.backend.features.monitor.checker.push

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.*
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.converter.MonitorStatusDatabaseConverter

@Entity
@Table(name = "monitor_push_entry")
class PushMonitorCheckerEntry(
    @Column(name = "push_id", nullable = false, length = NANO_ID_SMALL_LENGTH)
    val pushId: String,

    /**
     * Usage of `MonitorStatusDatabaseConverter` to minify enum to 1 char
     * @see MonitorStatusDatabaseConverter
     */
    @Column(name = "status", nullable = false, length = 1)
    val status: MonitorStatus,

    @Column(name = "title", nullable = false, length = Database.MAX_TITLE_LENGTH)
    val title: String,

    @Column(name = "message", nullable = true, length = Database.MAX_MESSAGE_LENGTH)
    val message: String? = null,

    @Column(name = "ping", nullable = true)
    var pingMs: Long? = null,
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
