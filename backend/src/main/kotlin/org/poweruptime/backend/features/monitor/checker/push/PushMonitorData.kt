package org.poweruptime.backend.features.monitor.checker.push

import jakarta.persistence.*
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.monitor.model.MONITOR_CHECKER_DATA_TABLE_NAME
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTypes
import org.poweruptime.backend.features.monitor.model.MonitorType

@Entity(name = "${MONITOR_CHECKER_DATA_TABLE_NAME}_${MonitorDataTypes.PUSH}")
@DiscriminatorValue(MonitorDataTypes.PUSH)
class PushMonitorData(
    @Column(name = "push_id", length = NANO_ID_SMALL_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_PUSH_ID_LENGTH, max = Database.MAX_PUSH_ID_LENGTH)
    val pushId: String,
) : MonitorData(MonitorType.PUSH) {
    // ObjectMapper needs an empty constructor
    constructor() : this("ID")
}
