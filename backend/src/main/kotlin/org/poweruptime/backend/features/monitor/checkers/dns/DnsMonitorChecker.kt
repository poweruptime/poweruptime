package org.poweruptime.backend.features.monitor.checkers.dns

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.monitor.checkers.CheckResultDto
import org.poweruptime.backend.features.monitor.checkers.MonitorChecker
import org.poweruptime.backend.features.monitor.checkers.MonitoringResultHandler
import org.poweruptime.backend.features.monitor.core.MonitorData
import org.poweruptime.backend.features.monitor.model.MonitorRecord
import org.poweruptime.backend.features.monitor.model.MonitorType
import org.xbill.DNS.DClass
import org.xbill.DNS.Message
import org.xbill.DNS.Name
import org.xbill.DNS.Record
import org.xbill.DNS.Resolver
import org.xbill.DNS.SimpleResolver
import org.xbill.DNS.Type
import java.net.InetAddress
import java.net.InetSocketAddress

private const val DNS_ANSWER_SECTION = 1

class DnsMonitorChecker : MonitorChecker(MonitorType.DNS) {
    private final val logger = KotlinLogging.logger {}

    @Suppress("ReturnCount", "DestructuringDeclarationWithTooManyEntries", "TooGenericExceptionCaught")
    override fun execute(monitor: MonitorRecord, data: MonitorData): CheckResultDto {
        data as DnsMonitorDataRecord

        val result = MonitoringResultHandler()
        try {
            val resolver = SimpleResolver().apply {
                address = InetSocketAddress(
                    InetAddress.getByName(data.server),
                    port,
                )
            }

            logger.debug {
                "Sending dns request for monitor '${monitor.name}' with id '${monitor.id}', " +
                    "host: '${data.host}', type: '${data.type}', " +
                    "checking for matches: '${data.matches != null}'"
            }

            val answerSection = getDNSAnswerSection(resolver, data.host, data.type)

            logger.debug { "Monitor '${monitor.id}', dns response '$answerSection'" }

            if (data.matches == null) {
                return if (answerSection.isEmpty()) {
                    result.error("DNS record(s) not found")
                } else {
                    result.success("DNS record(s) found", answerSection)
                }
            }

            val answers = parseAnswerSection(answerSection, data.type)

            logger.info { "Mapped answers '${answers.joinToString()}'" }

            if (answers.isEmpty()) {
                return result.error("DNS record(s) not found")
            }

            if (!data.matches.all { answers.contains(it) }) {
                return result.error(
                    title = "DNS record(s) not corresponding with specified matches",
                    message = """
                        |$answerSection
                        |
                        |=========
                        |Specified matches
                        |${data.matches.joinToString("\n")}
                    """.trimMargin(),
                )
            }

            return result.success("DNS record(s) found", answers.joinToString("\n"))
        } catch (_: Exception) {
            return result.error("DNS server unreachable")
        }
    }

    private fun getDNSAnswerSection(
        resolver: Resolver,
        host: String,
        type: DnsMonitorDataType
    ): String = resolver.send(
        Message.newQuery(
            Record.newRecord(
                Name.fromString(host.parseDnsHost()),
                type.toRecordType(),
                DClass.IN,
            ),
        ),
    ).sectionToString(DNS_ANSWER_SECTION).trimMargin()

    private fun parseAnswerSection(answerSection: String, type: DnsMonitorDataType): List<String> =
        answerSection.lines()
            .filter { it.contains("IN\t${type.name}") }
            .map { it.split(type.name).last().trim() }
}

private fun DnsMonitorDataType.toRecordType() = when (this) {
    DnsMonitorDataType.A -> Type.A
    DnsMonitorDataType.AAAA -> Type.AAAA
    DnsMonitorDataType.CAA -> Type.CAA
    DnsMonitorDataType.CNAME -> Type.CNAME
    DnsMonitorDataType.MX -> Type.MX
    DnsMonitorDataType.NS -> Type.NS
    DnsMonitorDataType.PTR -> Type.PTR
    DnsMonitorDataType.SOA -> Type.PTR
    DnsMonitorDataType.SRV -> Type.SRV
    DnsMonitorDataType.TXT -> Type.TXT
}

private fun String.parseDnsHost() = if (endsWith(".")) this else "$this."
