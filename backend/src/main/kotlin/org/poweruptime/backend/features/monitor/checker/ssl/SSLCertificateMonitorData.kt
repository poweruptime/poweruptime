package org.poweruptime.backend.features.monitor.checker.ssl

import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.jetbrains.exposed.v1.core.ResultRow
import org.jetbrains.exposed.v1.core.eq
import org.jetbrains.exposed.v1.jdbc.insert
import org.jetbrains.exposed.v1.jdbc.update
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorDataTable
import org.poweruptime.backend.features.monitor.model.MonitorType

object SSLCertificateMonitorData : MonitorDataTable(MonitorType.SSL_CERTIFICATE) {
    val url = varchar("ssl_certificate_url", Database.MAX_URL_LENGTH)
    val validDaysLeft = long("ssl_certificate_valid_days_left").nullable()

    override fun rowToRecord(row: ResultRow): SSLCertificateMonitorDataRecord = SSLCertificateMonitorDataRecord(
        url = row[url],
        validDaysLeft = row[validDaysLeft],
    )

    override fun insert(monitorId: ULong, data: MonitorData) {
        data as SSLCertificateMonitorDataRecord

        insert {
            it[id] = monitorId
            it[url] = data.url
            it[validDaysLeft] = data.validDaysLeft
        }
    }

    override fun update(monitorId: ULong, data: MonitorData) {
        data as SSLCertificateMonitorDataRecord

        update({ id eq monitorId }) {
            it[SSLCertificateMonitorData.url] = data.url
            it[SSLCertificateMonitorData.validDaysLeft] = data.validDaysLeft
        }
    }

    init {
        registerTable(this)
    }
}

data class SSLCertificateMonitorDataRecord(
    @get:NotBlank
    @get:Size(
        min = Database.MIN_URL_LENGTH,
        max = Database.MAX_URL_LENGTH,
    )
    @get:Pattern(regexp = Database.URL_REGEX)
    val url: String,

    @get:Min(Database.MIN_VALID_DAYS_LEFT)
    @get:Max(Database.MAX_VALID_DAYS_LEFT)
    val validDaysLeft: Long? = null,
) : MonitorData(MonitorType.SSL_CERTIFICATE)
