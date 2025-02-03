package org.poweruptime.backend.features.monitor.domain

import org.poweruptime.backend.core.domain.ISoftDeleteRepository
import org.poweruptime.backend.features.monitor.core.MonitorCheckerData
import org.springframework.stereotype.Repository

@Repository
interface MonitorCheckerDataRepository : ISoftDeleteRepository<MonitorCheckerData>
