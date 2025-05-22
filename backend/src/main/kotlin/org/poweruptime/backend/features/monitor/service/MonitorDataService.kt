package org.poweruptime.backend.features.monitor.service

import org.poweruptime.backend.core.service.ASoftDeleteEntityService
import org.poweruptime.backend.features.monitor.domain.MonitorDataRepository
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.springframework.stereotype.Service

@Service
class MonitorDataService(
    monitorDataRepository: MonitorDataRepository,
) : ASoftDeleteEntityService<MonitorData>(monitorDataRepository)
