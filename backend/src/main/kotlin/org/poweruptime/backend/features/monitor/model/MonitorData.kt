package org.poweruptime.backend.features.monitor.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.poweruptime.backend.features.monitor.core.MonitorDataTypeResolver

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.EXTERNAL_PROPERTY, property = "_type")
@JsonTypeIdResolver(MonitorDataTypeResolver::class)
abstract class MonitorData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: MonitorType
)
