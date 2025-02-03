package org.poweruptime.backend.features.monitor.checker.push

import jakarta.persistence.*
import jakarta.validation.constraints.*
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.features.monitor.core.*

@Entity
@DiscriminatorValue(MonitorCheckerTypes.PUSH)
class PushMonitorCheckerData(
    @Column(name = "push_id", length = NANO_ID_SMALL_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_PUSH_ID_LENGTH, max = Database.MAX_PUSH_ID_LENGTH)
    val pushId: String,
) : MonitorCheckerData(MonitorCheckerType.PUSH) {
    // ObjectMapper needs an empty constructor
    @Suppress("unused")
    constructor() : this("ID")
}
