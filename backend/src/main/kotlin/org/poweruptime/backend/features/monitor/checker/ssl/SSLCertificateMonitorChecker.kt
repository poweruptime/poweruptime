package org.poweruptime.backend.features.monitor.checker.ssl

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.service.TeamSettingService
import java.io.IOException
import java.net.URL
import java.security.cert.X509Certificate
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import javax.net.ssl.HttpsURLConnection

class SSLCertificateMonitorChecker(
    private val teamSettingService: TeamSettingService
) : MonitorChecker {
    override val type = MonitorCheckerType.SSL_CERTIFICATE

    override fun execute(monitor: Monitor): CheckResultDto {
        val sslCertificateMonitorCheckerData = monitor.checker as SSLCertificateMonitorCheckerData

        val result = MonitoringResultHandler()
        val currentTime = Instant.now()

        try {
            // Create a URL object
            val url = URL(sslCertificateMonitorCheckerData.url)

            // Open an HTTPS connection
            val connection = url.openConnection() as HttpsURLConnection
            connection.connect()

            // Get the certificates
            val certs = connection.serverCertificates

            // Check validity of all certificates
            val mappedCerts = certs.filterIsInstance<X509Certificate>().groupBy { cert ->
                val notAfter = cert.notAfter.toInstant()

                val valid = if (sslCertificateMonitorCheckerData.validDaysLeft != null) {
                    // Calculate remaining days
                    val daysRemaining = Duration.between(currentTime, notAfter).toDays()

                    daysRemaining >= sslCertificateMonitorCheckerData.validDaysLeft!!
                } else {
                    // Check if the certificate is invalid now
                    currentTime.isAfter(cert.notBefore.toInstant()) || currentTime.isBefore(notAfter)
                }

                return@groupBy valid
            }

            connection.disconnect()

            val teamTimeZoneId = teamSettingService.getTimeZone(monitor.team.id)

            return if (mappedCerts.isEmpty()) {
                result.error("No certificates found")
            } else if (mappedCerts[false]?.isNotEmpty() == true) {
                result.error(
                    title = "Certificate valid, but expiry check failed",
                    message = mappedCerts[false]!!.toMessage(currentTime, teamTimeZoneId),
                )
            } else {
                result.success(
                    title = "All certificates valid",
                    message = mappedCerts[true]!!.toMessage(currentTime, teamTimeZoneId),
                )
            }
        } catch (_: IOException) {
            return result.error("Invalid certificates")
        }
    }
}

fun List<X509Certificate>.toMessage(currentTime: Instant, zoneId: ZoneId) = this.joinToString("\n") {
    // Calculate remaining days
    val notAfter = it.notAfter.toInstant()
    val duration = Duration.between(currentTime, notAfter)

    "${
        subjectNameRegex.find(it.subjectX500Principal.name)?.value ?: it.subjectX500Principal.name
    }: ${duration.abs().toDays()} day(s) ${
        if (duration.toDays() >= 0) {"remaining, expires on"} else "overdue, expired on"
    } ${it.notAfter
        .toInstant()
        .atZone(zoneId)
        .format(DateTimeUtils.simpleDateTimeFormatter)
    } - ${
        issuerNameRegex.find(it.issuerX500Principal.name)?.value ?: it.issuerX500Principal.name
    }"
}

val issuerNameRegex = Regex("""(?<=O=)[^,]+""")
val subjectNameRegex = Regex("""(?<=CN=)[^,]+""")
