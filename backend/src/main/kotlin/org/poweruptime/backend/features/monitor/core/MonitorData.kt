package org.poweruptime.backend.features.monitor.core

import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import org.poweruptime.backend.features.monitor.checkers.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.http.HttpMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.push.PushMonitorDataRecord
import org.poweruptime.backend.features.monitor.checkers.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.monitor.model.MonitorTypes

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "_type",
)
@JsonSubTypes(
    JsonSubTypes.Type(value = DnsMonitorDataRecord::class, name = MonitorTypes.DNS),
    JsonSubTypes.Type(value = HttpMonitorDataRecord::class, name = MonitorTypes.HTTP),
    JsonSubTypes.Type(value = PingMonitorDataRecord::class, name = MonitorTypes.PING),
    JsonSubTypes.Type(value = PushMonitorDataRecord::class, name = MonitorTypes.PUSH),
    JsonSubTypes.Type(value = SSLCertificateMonitorDataRecord::class, name = MonitorTypes.SSL_CERTIFICATE),
)
@Suppress("AbstractClassCanBeConcreteClass")
abstract class MonitorData(
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    val _type: MonitorType,
)
