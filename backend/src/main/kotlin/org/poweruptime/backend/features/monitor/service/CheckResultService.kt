package org.poweruptime.backend.features.monitor.service

import org.jetbrains.exposed.v1.jdbc.selectAll
import org.poweruptime.backend.core.domain.findByIdOrThrow
import org.poweruptime.backend.core.domain.findIdByPublicIdOrThrow
import org.poweruptime.backend.core.utils.orThrowNotFound
import org.poweruptime.backend.features.monitor.domain.deleteByTeamIdAndOlderThan
import org.poweruptime.backend.features.monitor.domain.findAll
import org.poweruptime.backend.features.monitor.domain.findByStatusUpMonitorIdAndPickedUpBetween
import org.poweruptime.backend.features.monitor.model.CheckResultJoinMonitorAndTeamRecord
import org.poweruptime.backend.features.monitor.model.CheckResultRecord
import org.poweruptime.backend.features.monitor.model.CheckResultTable
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.poweruptime.backend.features.monitor.model.MonitorTable
import org.poweruptime.backend.features.monitor.model.rowToCheckResultRecord
import org.poweruptime.backend.features.monitor.model.rowToMonitorRecord
import org.poweruptime.backend.features.team.model.TeamTable
import org.poweruptime.backend.features.team.model.rowToTeamRecord
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant

@Service
@Transactional(readOnly = true)
class CheckResultService {
    fun getById(id: ULong): CheckResultRecord = CheckResultTable.findByIdOrThrow(id) {
        CheckResultTable.rowToCheckResultRecord(it)
    }

    fun getByIdJoinMonitorAndTeam(id: ULong): CheckResultJoinMonitorAndTeamRecord =
        CheckResultTable.innerJoin(MonitorTable).innerJoin(TeamTable).selectAll().where {
            CheckResultTable.id eq id
        }.limit(1).firstOrNull()?.let {
            CheckResultJoinMonitorAndTeamRecord(
                checkResult = CheckResultTable.rowToCheckResultRecord(it),
                monitor = MonitorTable.rowToMonitorRecord(it),
                team = TeamTable.rowToTeamRecord(it),
            )
        }.orThrowNotFound()

    fun getIdByPublicId(publicId: String): ULong = CheckResultTable.findIdByPublicIdOrThrow(publicId)

    fun getAllPaginated(
        pageable: Pageable,
        onlyChanges: Boolean,
        monitorId: ULong?,
        teamId: ULong?,
        userId: ULong?,
        statuses: List<MonitorStatus>?,
        hasNotification: Boolean?,
        start: Instant?,
        end: Instant?,
    ): Page<CheckResultJoinMonitorAndTeamRecord> = CheckResultTable.findAll(
        pageable = pageable,
        onlyChanges = onlyChanges,
        monitorId = monitorId,
        teamId = teamId,
        userId = userId,
        statuses = statuses,
        hasNotification = hasNotification,
        start = start,
        end = end,
    )

    fun getByStatusUpMonitorIdAndPickedUpBetween(
        monitorId: ULong,
        start: Instant,
        end: Instant
    ): List<CheckResultRecord> = CheckResultTable.findByStatusUpMonitorIdAndPickedUpBetween(monitorId, start, end)

    @Transactional
    fun deleteByTeamIdAndOlderThan(teamId: ULong, than: Instant): Int =
        CheckResultTable.deleteByTeamIdAndOlderThan(teamId, than)
}
