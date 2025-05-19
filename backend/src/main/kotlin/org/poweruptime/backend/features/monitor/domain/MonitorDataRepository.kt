package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.springframework.stereotype.Repository

@Repository
interface MonitorDataRepository : ISoftDeleteRepository<MonitorData>
