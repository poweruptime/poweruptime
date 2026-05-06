package org.poweruptime.backend.configuration.schedule

import org.poweruptime.backend.features.maintenance.service.MaintenanceService
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Component

@Component
class MaintenanceSchedule(private val maintenanceService: MaintenanceService) {
    @Scheduled(fixedDelay = 60_000L, initialDelay = 10_000L)
    fun processDueMaintenances() {
        maintenanceService.processDueMaintenances()
    }
}
