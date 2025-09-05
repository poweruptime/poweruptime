package org.poweruptime.backend.features.monitor.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.selectAll
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.domain.deleteById
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.dns.DnsMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.http.HttpMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ping.PingMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.push.PushMonitorDataTable
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataRecord
import org.poweruptime.backend.features.monitor.checker.ssl.SSLCertificateMonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class MonitorDataService {
    private final val logger = KotlinLogging.logger {}

    fun getTableByType(type: MonitorType): MonitorDataTable = when (type) {
        MonitorType.DNS -> DnsMonitorDataTable
        MonitorType.HTTP -> HttpMonitorDataTable
        MonitorType.PING -> PingMonitorDataTable
        MonitorType.PUSH -> PushMonitorDataTable
        MonitorType.SSL_CERTIFICATE -> SSLCertificateMonitorDataTable
    }

    fun findByIdAndType(id: ULong, type: MonitorType): MonitorData = getTableByType(type).let { table ->
        table.selectAll().where {
            table.id eq id
        }.limit(1)
            .firstOrNull()
            ?.let { table.rowToRecord(it) }
            ?: throw BadRequestException("$type monitor data not found")
    }

    @Transactional
    fun insert(monitor: MonitorRecord, data: MonitorData): MonitorData = when (data) {
        is DnsMonitorDataRecord -> DnsMonitorDataTable.insert {
            it[DnsMonitorDataTable.id] = monitor.id
            it[DnsMonitorDataTable.host] = data.host
            it[DnsMonitorDataTable.server] = data.server
            it[DnsMonitorDataTable.port] = data.port
            it[DnsMonitorDataTable.type] = data.type
            it[DnsMonitorDataTable.matches] = data.matches
        }
        is HttpMonitorDataRecord -> HttpMonitorDataTable.insert {
            it[HttpMonitorDataTable.id] = monitor.id
            it[HttpMonitorDataTable.url] = data.url
            it[HttpMonitorDataTable.method] = data.method
            it[HttpMonitorDataTable.contentType] = data.contentType
            it[HttpMonitorDataTable.allowedStatusCodeRanges] = data.allowedStatusCodeRanges
            it[HttpMonitorDataTable.maxRedirects] = data.maxRedirects
            it[HttpMonitorDataTable.ignoreTLS] = data.ignoreTLS
            it[HttpMonitorDataTable.certificateExpiry] = data.certificateExpiry
            it[HttpMonitorDataTable.certificateValidDaysLeft] = data.certificateValidDaysLeft
            it[HttpMonitorDataTable.body] = data.body
            it[HttpMonitorDataTable.searchTerm] = data.searchTerm
            it[HttpMonitorDataTable.authType] = data.authType
            it[HttpMonitorDataTable.basicAuthDataUsername] = data.basicAuthDataUsername
            it[HttpMonitorDataTable.basicAuthDataPassword] = data.basicAuthDataPassword
        }
        is PingMonitorDataRecord -> PingMonitorDataTable.insert {
            it[PingMonitorDataTable.id] = monitor.id
            it[PingMonitorDataTable.ip] = data.ip
            it[PingMonitorDataTable.port] = data.port
        }
        is PushMonitorDataRecord -> PushMonitorDataTable.insert {
            it[PushMonitorDataTable.id] = monitor.id
            it[PushMonitorDataTable.pushId] = data.pushId
        }
        is SSLCertificateMonitorDataRecord -> SSLCertificateMonitorDataTable.insert {
            it[SSLCertificateMonitorDataTable.id] = monitor.id
            it[SSLCertificateMonitorDataTable.url] = data.url
            it[SSLCertificateMonitorDataTable.validDaysLeft] = data.validDaysLeft
        }
        else -> {
            logger.error { "Unknown monitor data class: ${monitor.id} - $data" }
            throw IllegalArgumentException("Unknown monitor data class: ${monitor.id} - $data")
        }
    }.let {
        findByIdAndType(monitor.id, monitor.type)
    }

    @Transactional
    fun update(
        oldMonitor: MonitorRecord,
        updatedMonitor: MonitorRecord,
        data: MonitorData
    ): MonitorData {
        if (oldMonitor.type !== updatedMonitor.type) {
            getTableByType(oldMonitor.type).deleteById(oldMonitor.id)

            return insert(updatedMonitor, data)
        }

        return when (data) {
            is DnsMonitorDataRecord -> DnsMonitorDataTable.update({ DnsMonitorDataTable.id eq updatedMonitor.id }) {
                it[DnsMonitorDataTable.host] = data.host
                it[DnsMonitorDataTable.server] = data.server
                it[DnsMonitorDataTable.port] = data.port
                it[DnsMonitorDataTable.type] = data.type
                it[DnsMonitorDataTable.matches] = data.matches
            }
            is HttpMonitorDataRecord -> HttpMonitorDataTable.update({ HttpMonitorDataTable.id eq updatedMonitor.id }) {
                it[HttpMonitorDataTable.url] = data.url
                it[HttpMonitorDataTable.method] = data.method
                it[HttpMonitorDataTable.contentType] = data.contentType
                it[HttpMonitorDataTable.allowedStatusCodeRanges] = data.allowedStatusCodeRanges
                it[HttpMonitorDataTable.maxRedirects] = data.maxRedirects
                it[HttpMonitorDataTable.ignoreTLS] = data.ignoreTLS
                it[HttpMonitorDataTable.certificateExpiry] = data.certificateExpiry
                it[HttpMonitorDataTable.certificateValidDaysLeft] = data.certificateValidDaysLeft
                it[HttpMonitorDataTable.body] = data.body
                it[HttpMonitorDataTable.searchTerm] = data.searchTerm
                it[HttpMonitorDataTable.authType] = data.authType
                it[HttpMonitorDataTable.basicAuthDataUsername] = data.basicAuthDataUsername
                it[HttpMonitorDataTable.basicAuthDataPassword] = data.basicAuthDataPassword
            }
            is PingMonitorDataRecord -> PingMonitorDataTable.update({ PingMonitorDataTable.id eq updatedMonitor.id }) {
                it[PingMonitorDataTable.ip] = data.ip
                it[PingMonitorDataTable.port] = data.port
            }
            is PushMonitorDataRecord -> PushMonitorDataTable.update({ PushMonitorDataTable.id eq updatedMonitor.id }) {
                it[PushMonitorDataTable.pushId] = data.pushId
            }
            is SSLCertificateMonitorDataRecord -> SSLCertificateMonitorDataTable.update({
                SSLCertificateMonitorDataTable.id eq updatedMonitor.id
            }) {
                it[SSLCertificateMonitorDataTable.url] = data.url
                it[SSLCertificateMonitorDataTable.validDaysLeft] = data.validDaysLeft
            }
            else -> {
                logger.error { "Unknown monitor data class: ${updatedMonitor.id} - $data" }
                throw IllegalArgumentException("Unknown monitor data class: ${updatedMonitor.id} - $data")
            }
        }.let {
            findByIdAndType(updatedMonitor.id, updatedMonitor.type)
        }
    }
}
