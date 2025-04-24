package org.poweruptime.backend.features.monitor.checker.ssl

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.Monitor
import org.poweruptime.backend.features.team.service.TeamSettingService
import java.io.IOException
import java.net.URL
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertificateException
import java.security.cert.X509Certificate
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import javax.net.ssl.*
import javax.net.ssl.HttpsURLConnection

class SSLCertificateMonitorChecker(
    private val teamSettingService: TeamSettingService
) : MonitorChecker {
    override val type = MonitorCheckerType.SSL_CERTIFICATE

    override fun execute(monitor: Monitor): CheckResultDto {
        val sslData = monitor.checker as SSLCertificateMonitorCheckerData
        val result = MonitoringResultHandler()
        val now = Instant.now()

        try {
            // 1) Grab the default TM
            val tmf = TrustManagerFactory
                .getInstance(TrustManagerFactory.getDefaultAlgorithm())
            tmf.init(null as KeyStore?)

            val defaultTm = tmf.trustManagers
                .filterIsInstance<X509TrustManager>()
                .firstOrNull()
                ?: error("No X509TrustManager found")

            // 2) Build our “swallow all CertificateException” TM
            val permissiveTm = object : X509TrustManager {
                override fun getAcceptedIssuers(): Array<X509Certificate> =
                    defaultTm.acceptedIssuers

                override fun checkClientTrusted(
                    chain: Array<out X509Certificate>,
                    authType: String
                ) = defaultTm.checkClientTrusted(chain, authType)

                override fun checkServerTrusted(
                    chain: Array<out X509Certificate>,
                    authType: String
                ) {
                    try {
                        defaultTm.checkServerTrusted(chain, authType)
                    } catch (_: CertificateException) {
                        // swallow every certificate exception (expired, path, whatever)
                    }
                }
            }

            // 3) Init an SSLContext with it
            val sslContext = SSLContext.getInstance("TLS").apply {
                init(null, arrayOf<TrustManager>(permissiveTm), SecureRandom())
            }

            // 3) open the connection & inject our SSLSocketFactory
            val url = URL(sslData.url)
            val conn = url.openConnection() as HttpsURLConnection
            conn.sslSocketFactory = sslContext.socketFactory
            conn.connectTimeout = 5_000
            conn.readTimeout = 5_000
            conn.connect()

            val certs = conn.serverCertificates
                .filterIsInstance<X509Certificate>()

            conn.disconnect()

            if (certs.isEmpty()) {
                return result.error("No certificates found")
            }

            // group by “still within your expected days‐left” vs “too close/expired”
            val grouped = certs.groupBy { cert ->
                val expiresAt = cert.notAfter.toInstant()
                val validDaysLeft = sslData.validDaysLeft
                if (validDaysLeft != null) {
                    Duration.between(now, expiresAt).toDays() >= validDaysLeft
                } else {
                    // if no threshold given, just check “is it not yet expired?”
                    now.isBefore(expiresAt)
                }
            }

            val tz = teamSettingService.getTimeZone(monitor.team.id)

            return when {
                grouped[false]?.isNotEmpty() == true -> result.error(
                    title = "Certificate valid, but expiry check failed",
                    message = grouped[false]!!
                        .toMessage(now, tz),
                )

                else -> result.success(
                    title = "All certificates valid",
                    message = grouped[true]!!
                        .toMessage(now, tz),
                )
            }
        } catch (e: IOException) {
            return result.error("I/O error validating certificate", e.message)
        } catch (e: Exception) {
            return result.error("Unexpected error", e.message)
        }
    }
}

private fun List<X509Certificate>.toMessage(currentTime: Instant, zoneId: ZoneId) = this.joinToString("\n") {
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

private val issuerNameRegex = Regex("""(?<=O=)[^,]+""")
private val subjectNameRegex = Regex("""(?<=CN=)[^,]+""")
