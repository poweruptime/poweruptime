package org.poweruptime.backend.features.monitor.checker.dns

import org.poweruptime.backend.features.monitor.core.*
import org.poweruptime.backend.features.monitor.model.Monitor
import org.slf4j.LoggerFactory
import org.xbill.DNS.*
import java.net.InetAddress
import java.net.InetSocketAddress

private const val DNS_ANSWER_SECTION = 1

class DnsMonitorChecker : MonitorChecker {
    private val logger = LoggerFactory.getLogger(DnsMonitorChecker::class.java)

    override val type = MonitorCheckerType.DNS

    @Suppress("ReturnCount", "DestructuringDeclarationWithTooManyEntries", "TooGenericExceptionCaught")
    override fun execute(monitor: Monitor): CheckResultDto {
        val dnsMonitorCheckerData = monitor.checker as DnsMonitorCheckerData

        val result = MonitoringResultHandler()
        try {
            val resolver = SimpleResolver().apply {
                address = InetSocketAddress(
                    InetAddress.getByName(dnsMonitorCheckerData.server),
                    port,
                )
            }

            logger.debug(
                """Sending dns request for monitor "{}" with id "{}", host: "{]", type: "{}",
                |dns server: "{}", checking for matches {}
                """.trimMargin(),
                monitor.name,
                monitor.id,
                dnsMonitorCheckerData.host,
                type,
                dnsMonitorCheckerData.matches != null,
            )

            val answerSection = getDNSAnswerSection(resolver, dnsMonitorCheckerData.host, dnsMonitorCheckerData.type)

            logger.debug("""Monitor "{}", dns response "{}" """, monitor.id, answerSection)

            if (dnsMonitorCheckerData.matches == null) {
                return if (answerSection.isEmpty()) {
                    result.error("DNS record(s) not found")
                } else {
                    result.success("DNS record(s) found", answerSection)
                }
            }

            val answers = parseAnswerSection(answerSection, dnsMonitorCheckerData.type)

            logger.info("""Mapped answers "{}"""", answers.joinToString())

            if (answers.isEmpty()) {
                return result.error("DNS record(s) not found")
            }

            if (!dnsMonitorCheckerData.matches.all { answers.contains(it) }) {
                return result.error(
                    title = "DNS record(s) not corresponding with specified matches",
                    message = """
                        |$answerSection
                        |
                        |=========
                        |Specified matches
                        |${dnsMonitorCheckerData.matches.joinToString("\n")}
                    """.trimMargin(),
                )
            }

            return result.success("DNS record(s) found", answers.joinToString("\n"))
        } catch (ex: Exception) {
            return result.error("DNS server unreachable")
        }
    }

    private fun getDNSAnswerSection(
        resolver: Resolver,
        host: String,
        type: DnsMonitorCheckerDataType
    ): String = resolver.send(
        Message.newQuery(
            Record.newRecord(
                Name.fromString(host.parseDnsHost()),
                type.toRecordType(),
                DClass.IN,
            ),
        ),
    ).sectionToString(DNS_ANSWER_SECTION).trimMargin()

    private fun parseAnswerSection(answerSection: String, type: DnsMonitorCheckerDataType): List<String> =
        answerSection.lines()
            .filter { it.contains("IN\t${type.name}") }
            .map { it.split(type.name).last().trim() }
}

private fun DnsMonitorCheckerDataType.toRecordType() = when (this) {
    DnsMonitorCheckerDataType.A -> Type.A
    DnsMonitorCheckerDataType.AAAA -> Type.AAAA
    DnsMonitorCheckerDataType.CAA -> Type.CAA
    DnsMonitorCheckerDataType.CNAME -> Type.CNAME
    DnsMonitorCheckerDataType.MX -> Type.MX
    DnsMonitorCheckerDataType.NS -> Type.NS
    DnsMonitorCheckerDataType.PTR -> Type.PTR
    DnsMonitorCheckerDataType.SOA -> Type.PTR
    DnsMonitorCheckerDataType.SRV -> Type.SRV
    DnsMonitorCheckerDataType.TXT -> Type.TXT
}

private fun String.parseDnsHost() = if (endsWith(".")) this else "$this."
