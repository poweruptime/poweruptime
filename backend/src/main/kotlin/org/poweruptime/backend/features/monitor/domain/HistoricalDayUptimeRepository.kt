package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.features.monitor.model.HistoricalDayUptime
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate

interface HistoricalDayUptimeRepository : JpaRepository<HistoricalDayUptime, String> {
    @Query(
        """
    SELECT hdu FROM HistoricalDayUptime hdu
    WHERE hdu.monitor.id = :monitorId
      AND hdu.date >= :start and hdu.date < :end
      order by hdu.date desc
""",
    )
    fun findByMonitorIdBetweenDates(
        @Param("monitorId") monitorId: String,
        @Param("start") start: LocalDate,
        @Param("end") end: LocalDate,
    ): List<HistoricalDayUptime>
}
