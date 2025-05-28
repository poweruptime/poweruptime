package org.poweruptime.backend.features.info.supporter

import com.fasterxml.jackson.databind.ObjectMapper
import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.core.exceptions.NotFoundException
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.springframework.http.HttpEntity
import org.springframework.http.HttpMethod
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.Instant

@Service
class SupporterService(
    private val restTemplate: RestTemplate,
    private val objectMapper: ObjectMapper,
    private val instanceSettingService: InstanceSettingService,
) {
    private final val logger = KotlinLogging.logger {}

    private val testHandle = "Test1234"

    fun check(
        githubHandle: String? = instanceSettingService.getSupportLookup()
    ): Boolean {
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

    private fun fetchSponsors(): GitHubSponsorsResponse {
        val response = restTemplate.exchange(
            "https://sponsors.trnck.dev/sponsors/dafnik",
            HttpMethod.GET,
            HttpEntity.EMPTY,
            String::class.java,
        )
        val body = response.body
            .takeUnless { it.isNullOrBlank() }
            ?: throw NotFoundException("Empty sponsors response")
        return objectMapper.readValue(body, GitHubSponsorsResponse::class.java)
    }

    private fun isSupporter(
        handle: String,
        sponsors: List<GitHubSponsorDto>
    ) = handle == testHandle || sponsors.any { it.handle == handle }

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
