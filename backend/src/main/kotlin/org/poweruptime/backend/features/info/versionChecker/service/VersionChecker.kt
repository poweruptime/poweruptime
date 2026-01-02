package org.poweruptime.backend.features.info.versionChecker.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.insert
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.info.InfoService
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.info.versionChecker.VersionCheckMail
import org.poweruptime.backend.features.info.versionChecker.dto.CachedVersionResult
import org.poweruptime.backend.features.info.versionChecker.dto.VersionCheckResponse
import org.poweruptime.backend.features.info.versionChecker.findByVersion
import org.poweruptime.backend.features.mail.emails.NewVersionEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.user.domain.findByRole
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant

@Service
class VersionChecker(
    private val infoService: InfoService,
    private val instanceSettingService: InstanceSettingService,
    private val systemEmailService: SystemEmailService,
    private val gitHubVersionService: GitHubVersionService,
) {
    private final val logger = KotlinLogging.logger {}

    fun checkAndSendNewVersionMail() {
        logger.debug { "Starting send new version mail" }
        val latestVersion = checkForLatestVersion(true)

        if (latestVersion == null) {
            logger.debug { "No newer version available" }
            return
        }

        val existingVersionCheckMail = VersionCheckMail.findByVersion(latestVersion.version)
        if (existingVersionCheckMail != null) {
            logger.debug { "New version available but email already sent" }
            return
        }

        if (!instanceSettingService.getVersionCheckAdminMailEnabled()) {
            logger.info { "New version available but notification disabled." }
            return
        }

        val to = instanceSettingService.getVersionCheckAdminMailTo()
            ?: User.findByRole(SystemRole.ADMIN).map { it.email }

        if (to.isEmpty()) {
            logger.error { "New version available but no recipients found." }
            return
        }

        systemEmailService.queueEmail(NewVersionEmail(to.toSet(), latestVersion.version))
        VersionCheckMail.insert {
            it[puVersion] = latestVersion.version
        }
    }

    // Single cache entry with 30-minute expiration
    @Volatile
    private var cachedResult: CachedVersionResult? = null
    private val cacheExpirationMinutes = 60L

    fun checkForLatestVersion(skipCache: Boolean = false): VersionCheckResponse? {
        logger.debug { "Starting version check (skipCache: $skipCache)" }

        if (!instanceSettingService.getVersionCheckEnabled()) {
            logger.debug { "Version checking is disabled in instance settings" }
            return null
        }

        val currentVersion = infoService.version
        logger.debug { "Current version: $currentVersion" }

        val now = Instant.now()

        // Check if we have a valid cached result
        if (!skipCache) {
            cachedResult?.let { cached ->
                val cacheAge = Duration.between(cached.timestamp, now)
                if (cacheAge.toMinutes() < cacheExpirationMinutes) {
                    logger.info { "Using cached version check result (age: ${cacheAge.toMinutes()} minutes)" }
                    return cached.result
                }
                logger.debug {
                    "Cache expired (age: ${cacheAge.toMinutes()} minutes, max: $cacheExpirationMinutes minutes)"
                }
            } ?: logger.debug { "No cached result available" }
        } else {
            logger.debug { "Skipping cache as requested" }
        }

        // Cache miss or expired - fetch new result
        logger.info { "Fetching latest version from GitHub" }
        val result = try {
            gitHubVersionService.fetchLatestVersion(currentVersion)
        } catch (e: Exception) {
            logger.error { "Failed to fetch latest version from GitHub, ex: $e" }
            return null
        }

        // Store in cache
        cachedResult = CachedVersionResult(result, now)
        logger.debug { "Cached new version check result" }

        return result?.also {
            logger.info { "New version available: $it" }
        } ?: run {
            logger.info { "No newer version available" }
            null
        }
    }

    fun clearCache() {
        logger.info { "Clearing version check cache" }
        cachedResult = null
    }
}
