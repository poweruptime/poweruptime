package org.poweruptime.backend.features.monitor.core

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import org.poweruptime.backend.features.monitor.checkers.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.http.HttpMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.push.PushMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import kotlin.reflect.KClass

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "_type",
)
@JsonTypeIdResolver(MonitorDataTypeResolver::class)
abstract class MonitorData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: MonitorType
) {
    companion object {
        private val registry = mutableMapOf<String, KClass<out MonitorData>>()

        private fun registerDataRecord(type: MonitorType, clazz: KClass<out MonitorData>) {
            registry[type.code] = clazz
        }

        fun forType(type: String): KClass<out MonitorData> =
            registry[type] ?: error("Unknown monitor type: $type")

        fun forClass(klass: KClass<*>?): String =
            registry.entries.find { it.value == klass }?.key
                ?: error("Unknown monitor class: ${klass?.simpleName ?: "null"}")

        init {
            registerDataRecord(MonitorType.DNS, DnsMonitorDataRecord::class)
            registerDataRecord(MonitorType.HTTP, HttpMonitorDataRecord::class)
            registerDataRecord(MonitorType.PING, PingMonitorDataRecord::class)
            registerDataRecord(MonitorType.PUSH, PushMonitorDataRecord::class)
            registerDataRecord(MonitorType.SSL_CERTIFICATE, SSLCertificateMonitorDataRecord::class)
        }
    }
}
