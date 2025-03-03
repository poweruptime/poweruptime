package org.poweruptime.backend.features.monitor.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import java.math.BigDecimal
import java.time.LocalDate

@Entity
@Table(
    name = "historical_day_uptime",
    uniqueConstraints = [UniqueConstraint(columnNames = ["date", "monitor_id"])],
)
class HistoricalDayUptime(
    @JoinColumn(name = "monitor_id", nullable = false)
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val monitor: Monitor,

    @Column(name = "date", columnDefinition = "date", nullable = false)
    var date: LocalDate,

    @Column(name = "uptime", nullable = false, columnDefinition = "numeric")
    var uptime: BigDecimal,
) {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    lateinit var id: String
}
