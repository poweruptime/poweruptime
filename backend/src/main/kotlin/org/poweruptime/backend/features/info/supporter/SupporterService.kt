package org.poweruptime.backend.features.info.supporter

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.time.Instant
import java.util.Calendar
import java.util.Locale

@Service
class SupporterService(
    private val restClient: RestClient,
    private val instanceSettingService: InstanceSettingService,
) {
    private final val logger = KotlinLogging.logger {}

    // Test-11-2025
    private fun testHandle() = "Test-${
        Calendar.getInstance().let {
            String.format(Locale.US, "%02d-%04d", it.get(Calendar.MONTH) + 1, it.get(Calendar.YEAR))
        }
    }"

    fun check(githubHandle: String? = instanceSettingService.getSupportLookup()): Boolean {
        val handle = githubHandle?.takeIf { it.isNotBlank() } ?: return false

        val sponsorsResponse = try {
            fetchSponsors()
        } catch (e: Exception) {
            logger.error { "Could not load or parse GitHub sponsors, ex: $e" }
            return false
        }

        val isSupporter = isSupporter(handle, sponsorsResponse.sponsors)
        updateSupportSince(isSupporter)
        return isSupporter
    }

    private fun fetchSponsors(): GitHubSponsorsResponse = restClient
        .get()
        .uri("https://sponsors.trnck.dev/sponsors/dafnik")
        .retrieve()
        .toEntity(GitHubSponsorsResponse::class.java)
        .body
        ?: throw NotFoundException("Empty sponsors response")

    private fun isSupporter(handle: String, sponsors: List<GitHubSponsorDto>): Boolean =
        handle == testHandle() || sponsors.any { it.handle == handle }

    private fun updateSupportSince(isSupporter: Boolean) {
        val since = instanceSettingService.getSupportsSince()
        when {
            isSupporter && since == null ->
                instanceSettingService.setSupportSince(Instant.now())

            !isSupporter && since != null ->
                instanceSettingService.setSupportSince(null)
        }
    }
}
