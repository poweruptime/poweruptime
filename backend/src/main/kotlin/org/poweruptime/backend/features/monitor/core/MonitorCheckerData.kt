package org.poweruptime.backend.features.monitor.core

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import jakarta.persistence.*
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import java.time.Duration
import java.time.Instant

/**
 * Base entity for a MonitorCheckerData.
 */
@Entity(name = MONITOR_CHECKER_DATA_TABLE_NAME)
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "_type", discriminatorType = DiscriminatorType.STRING)
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "_type")
@JsonTypeIdResolver(MonitorCheckerDataTypeResolver::class)
abstract class MonitorCheckerData(
    /**
     * This maps the discriminator column to a read-only property.
     * It's marked as insertable = false, updatable = false because the discriminator
     * should be controlled by the inheritance mapping, not manually.
     */
    @Column(name = "_type", insertable = false, updatable = false)
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    open val _type: MonitorCheckerType
) : ASoftDeleteEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    @JsonIgnore
    override lateinit var id: String
}

class MonitoringResultHandler {
    private val start: Instant = Instant.now()

    private fun getPingMs(): Long = Duration.between(start, Instant.now()).toMillis()

    fun error(title: String, message: String? = null, ping: Long? = null) = CheckResultDto(
        isUp = false,
        pingMs = ping ?: getPingMs(),
        title = title,
        message = message,
    )

    fun success(title: String, message: String? = null, ping: Long? = null) = CheckResultDto(
        isUp = true,
        pingMs = ping ?: getPingMs(),
        title = title,
        message = message,
    )
}

data class CheckResultDto(val pingMs: Long, val isUp: Boolean, val title: String, val message: String? = null)

const val MONITOR_CHECKER_DATA_TABLE_NAME = "monitor_checker_data"
