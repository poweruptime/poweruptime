package org.poweruptime.backend.features.monitor.checker.ssl

import org.poweruptime.backend.core.utils.DateTimeUtils
import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.poweruptime.backend.features.team.service.TeamSettingService
import java.io.IOException
import java.net.URL
import java.security.KeyStore
import java.security.SecureRandom
import java.security.cert.CertPathValidatorException
import java.security.cert.CertificateException
import java.security.cert.CertificateExpiredException
import java.security.cert.CertificateNotYetValidException
import java.security.cert.X509Certificate
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import javax.net.ssl.*
import javax.net.ssl.HttpsURLConnection

class SSLCertificateMonitorChecker(
    private val teamSettingService: TeamSettingService
) : MonitorChecker {
    override val type = MonitorType.SSL_CERTIFICATE

    @Suppress("ReturnCount")
    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        val sslData = data as SSLCertificateMonitorDataRecord
        val result = MonitoringResultHandler()
        val now = Instant.now()

        try {
            val certs = makeRequest(sslData.url)

            if (certs.isEmpty()) {
                return result.error("No certificates found")
            }

            // group by “still within your expected days‐left” vs. “too close/expired”
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

            val tz = teamSettingService.getTimeZone(monitor.teamId)

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
        } catch (e: SSLHandshakeException) {
            // untrusted‐root, self‐signed, bad‐chain, etc.
            return result.error("Certificate trust error", e.cause?.message ?: e.message)
        } catch (e: IOException) {
            return result.error("Certificate trust error", e.cause?.message ?: e.message)
        } catch (e: Exception) {
            return result.error("Unexpected error", e.message)
        }
    }
}

private fun makeRequest(url: String): List<X509Certificate> {
    // 1) Default X509TrustManager
    val tmf = TrustManagerFactory
        .getInstance(TrustManagerFactory.getDefaultAlgorithm())
    tmf.init(null as KeyStore?)
    val defaultTm = tmf.trustManagers
        .filterIsInstance<X509TrustManager>()
        .firstOrNull()
        ?: error("No X509TrustManager found")

    // 2) Wrap it so only date-errors are swallowed
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
            } catch (e: CertificateException) {
                if (!isDateOnlyException(e)) {
                    // re-throw everything *except* expired / not-yet-valid
                    throw e
                }
                // otherwise swallow and let us handle expiry below
            }
        }
    }

    val sslContext = SSLContext.getInstance("TLS").apply {
        init(null, arrayOf<TrustManager>(permissiveTm), SecureRandom())
    }

    val url = URL(url)
    val conn = (url.openConnection() as HttpsURLConnection).apply {
        sslSocketFactory = sslContext.socketFactory
        connectTimeout = 4_000
        readTimeout = 4_000
        connect()
    }

    val certs = conn.serverCertificates
        .filterIsInstance<X509Certificate>()
    conn.disconnect()

    return certs
}

/**
 * Walks the cause chain and returns true if the failure
 * is *only* due to expiry / not‐yet‐valid.
 */
private fun isDateOnlyException(e: CertificateException): Boolean {
    var curr: Throwable? = e
    while (curr != null) {
        when (curr) {
            is CertificateExpiredException,
            is CertificateNotYetValidException -> return true
            is CertPathValidatorException -> {
                val reason = curr.reason
                // only swallow EXPIRED or NOT_YET_VALID
                if (reason == CertPathValidatorException.BasicReason.EXPIRED ||
                    reason == CertPathValidatorException.BasicReason.NOT_YET_VALID
                ) {
                    return true
                }
            }
        }
        curr = curr.cause
    }
    return false
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
