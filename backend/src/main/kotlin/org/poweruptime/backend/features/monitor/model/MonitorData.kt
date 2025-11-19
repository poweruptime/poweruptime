package org.poweruptime.backend.features.monitor.model

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.core.MonitorDataTypeResolver
import kotlin.reflect.KClass

@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "_type")
@JsonTypeIdResolver(MonitorDataTypeResolver::class)
abstract class MonitorData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: MonitorType
) {
    companion object {
        private val registry = mutableMapOf<String, KClass<out MonitorData>>()

        private fun registerDataRecord(type: String, clazz: KClass<out MonitorData>) {
            registry[type] = clazz
        }

        fun forType(type: String): KClass<out MonitorData> =
            registry[type] ?: error("Unknown monitor type: $type")

        fun forClass(klass: KClass<*>?): String =
            registry.entries.find { it.value == klass }?.key
                ?: error("Unknown monitor class: ${klass?.simpleName ?: "null"}")

        init {
            registerDataRecord(MonitorDataTypes.DNS, DnsMonitorDataRecord::class)
            registerDataRecord(MonitorDataTypes.HTTP, HttpMonitorDataRecord::class)
            registerDataRecord(MonitorDataTypes.PING, PingMonitorDataRecord::class)
            registerDataRecord(MonitorDataTypes.PUSH, PushMonitorDataRecord::class)
            registerDataRecord(MonitorDataTypes.SSL_CERTIFICATE, SSLCertificateMonitorDataRecord::class)
        }
    }
}
