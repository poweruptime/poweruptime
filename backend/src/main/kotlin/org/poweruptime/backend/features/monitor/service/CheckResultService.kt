package org.poweruptime.backend.features.monitor.service

import me.dafnik.JpaSpecificationBuilder.buildSpecification
import org.poweruptime.backend.core.dto.PageableValidator
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.monitor.domain.CheckResultRepository
import org.poweruptime.backend.features.monitor.model.CheckResult
import org.poweruptime.backend.features.monitor.model.MonitorStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant

@Service
class CheckResultService(
    private val checkResultRepository: CheckResultRepository
) : AEntityService<CheckResult>(checkResultRepository) {
    fun deleteByTeamIdAndOlderThan(teamId: String, than: Instant) = checkResultRepository.findByTeamIdAndOlderThan(
        teamId,
        than,
    ).apply {
        deleteAll(this)
    }

    fun getAllPaginated(
        pageable: Pageable,
        onlyChanges: Boolean,
        monitorId: String?,
        teamId: String?,
        userId: String?,
        statuses: List<MonitorStatus>?,
    ): Page<CheckResult> = checkResultRepository.findAll(
        buildSpecification {
            distinct = true

            where {
                and {
                    require(
                        userId != null || monitorId != null || teamId != null,
                    ) { "teamId or monitorId or userId needs to be provided" }
                    and {
                        teamId?.let { col("monitor.team.id") eq it }
                        monitorId?.let { col("monitor.id") eq it }
                        userId?.let { col("monitor.team.teamUsers.id.user.id") eq it }
                    }

                    and {
                        statuses?.ifEmpty { null }?.let { col(CheckResult::status) inList it }

                        if (onlyChanges) {
                            col(CheckResult::status) notEq col(CheckResult::previousStatus)
                        }
                        if (teamId != null || userId != null) {
                            col("monitor.deleted").isNull()
                        }
                    }
                }
            }
        },
        PageableValidator.validateSort(
            pageable,
            listOf("status", "pickedUpAt", "checkedAt", "createdAt"),
        ),
    )
}
