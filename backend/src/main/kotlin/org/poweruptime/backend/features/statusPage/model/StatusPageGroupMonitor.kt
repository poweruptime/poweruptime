package org.poweruptime.backend.features.statusPage.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.models.HasPosition
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.monitor.model.Monitor
import java.io.Serializable

@Embeddable
data class StatusPageGroupMonitorId(
    @JoinColumn(name = "status_page_group_id", nullable = false)
    @ManyToOne(fetch = FetchType.EAGER)
    @OnDelete(action = OnDeleteAction.CASCADE)
    var group: StatusPageGroup,

    @JoinColumn(name = "monitor_id", nullable = false)
    @ManyToOne(fetch = FetchType.EAGER)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val monitor: Monitor,
) : Serializable

@Entity
@Table(
    name = "status_page_group_monitor",
    uniqueConstraints = [UniqueConstraint(columnNames = ["status_page_id", "monitor_id"])],
)
class StatusPageGroupMonitor(
    @EmbeddedId
    val connection: StatusPageGroupMonitorId,

    @JoinColumn(name = "status_page_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val statusPage: StatusPage,

    @Column(name = "position", nullable = true)
    override var position: Int? = null,
) : HasPosition {
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override var id: String = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH)
}
