package org.poweruptime.backend.features.info

import com.fasterxml.jackson.databind.ObjectMapper
import org.poweruptime.backend.features.instanceSetting.InstanceSettingService
import org.slf4j.LoggerFactory
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
    private val logger = LoggerFactory.getLogger(SupporterService::class.java)

    @Suppress("ReturnCount")
    fun check() {
        val githubHandle = instanceSettingService.getSupportLookup()

        if (githubHandle.isNullOrBlank()) return

        val response = try {
            restTemplate.exchange(
                "https://sponsors.trnck.dev/sponsors/dafnik",
                HttpMethod.GET,
                HttpEntity(""),
                String::class.java,
            )
        } catch (e: Throwable) {
            logger.error("Could not load GitHub sponsors.", e)
            return
        }

        val body = response.body
        if (body.isNullOrBlank()) return

        val sponsorsResponse = try {
            objectMapper.readValue(body, GitHubSponsorsResponse::class.java)
        } catch (e: Exception) {
            logger.error("Failed to parse GitHubSponsorsResponse", e)
            return
        }

        val isSupporter = githubHandle == "Test1234" || sponsorsResponse.sponsors.any { it.handle == githubHandle }
        val supportsSince = instanceSettingService.getSupportsSince()

        if (isSupporter && supportsSince == null) {
            instanceSettingService.setSupportSince(Instant.now())
            return
        }

        if (!isSupporter && supportsSince != null) {
            instanceSettingService.setSupportSince(null)
        }
    }
}

data class GitHubSponsorDto(
    val handle: String,
    val avatar: String,
    val profile: String,
)

data class GitHubSponsorsResponse(
    val sponsors: List<GitHubSponsorDto>
)
