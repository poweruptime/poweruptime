package org.poweruptime.backend.features.monitor.service

import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.monitor.core.MonitorCheckerData
import org.poweruptime.backend.features.monitor.domain.MonitorCheckerDataRepository
import org.springframework.stereotype.Service

@Service
class MonitorCheckerDataService(
    monitorCheckerDataRepository: MonitorCheckerDataRepository,
) : ASoftDeleteEntityService<MonitorCheckerData>(monitorCheckerDataRepository)
