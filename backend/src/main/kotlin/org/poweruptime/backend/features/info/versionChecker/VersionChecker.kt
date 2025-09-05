package org.poweruptime.backend.features.info.versionChecker

import io.github.oshai.kotlinlogging.KotlinLogging
import org.jetbrains.exposed.v1.jdbc.insert
import org.poweruptime.backend.features.authentication.model.SystemRole
import org.poweruptime.backend.features.authentication.model.UserTable
import org.poweruptime.backend.features.info.InfoService
import org.poweruptime.backend.features.info.instanceSetting.InstanceSettingService
import org.poweruptime.backend.features.mail.emails.NewVersionEmail
import org.poweruptime.backend.features.mail.service.SystemEmailService
import org.poweruptime.backend.features.user.domain.findByRole
import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.Duration
import java.time.Instant

@Service
class VersionChecker(
    private val restTemplate: RestTemplate,
    private val infoService: InfoService,
    private val instanceSettingService: InstanceSettingService,
    private val systemEmailService: SystemEmailService,
) {
    private final val logger = KotlinLogging.logger {}

    fun checkAndSendNewVersionMail() {
        logger.debug { "Starting send new version mail" }
        val latestVersion = checkForLatestVersion(true)

        if (latestVersion == null) {
            logger.debug { "No newer version available" }
            return
        }

        val existingVersionCheckMail = VersionCheckMailTable.findByVersion(latestVersion)
        if (existingVersionCheckMail != null) {
            logger.debug { "New version available but email already sent" }
            return
        }

        val to =
            instanceSettingService.getVersionCheckAdminMailTo()
                ?: UserTable.findByRole(SystemRole.ADMIN).map { it.email }

        if (to.isEmpty()) {
            logger.error { "New version available but no recipients found." }
            return
        }

        systemEmailService.queueEmail(NewVersionEmail(to.toSet(), latestVersion))
        VersionCheckMailTable.insert {
            it[puVersion] = latestVersion
        }
    }

    // Single cache entry with 30-minute expiration
    @Volatile
    private var cachedResult: CachedVersionResult? = null
    private val cacheExpirationMinutes = 30L

    fun checkForLatestVersion(skipCache: Boolean = false): String? {
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
            fetchLatestVersion(currentVersion)
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

    @Suppress("LongMethod", "LoopWithTooManyJumpStatements")
    private fun fetchLatestVersion(currentVersion: String): String? {
        val currentVersionInfo = parseVersion(currentVersion)
        if (currentVersionInfo == null) {
            logger.warn { "Could not parse current version: $currentVersion" }
            return null
        }

        val isBetaChannel = currentVersionInfo.isBeta
        logger.debug {
            "Checking for updates on ${if (isBetaChannel) "beta" else "stable"} channel"
        }

        var url: String? = "https://api.github.com/repos/poweruptime/poweruptime/tags"
        var latestVersion: VersionInfo? = null
        var pageCount = 0

        while (url != null) {
            pageCount++
            logger.debug { "Fetching GitHub tags page $pageCount from: $url" }

            val response = try {
                makeRequest(url)
            } catch (e: Exception) {
                logger.error { "Failed to fetch GitHub tags from URL: $url, ex: $e" }
                break
            }

            val tags = response.body ?: emptyArray()
            logger.debug { "Retrieved ${tags.size} tags from page $pageCount" }

            // Filter and parse versions based on channel
            val validVersions = tags
                .mapNotNull { tag ->
                    parseVersion(tag.name).also { version ->
                        if (version == null) {
                            logger.debug { "Could not parse version tag: ${tag.name}" }
                        }
                    }
                }
                .filter { it.isBeta == isBetaChannel }
                .sorted()
                .reversed() // Get latest first

            logger.debug {
                "Found ${validVersions.size} valid ${if (isBetaChannel) "beta" else "stable"} versions " +
                    "on page $pageCount"
            }

            if (validVersions.isNotEmpty()) {
                latestVersion = validVersions.first()
                logger.debug { "Latest version found: ${latestVersion.originalVersion}" }
                break
            }

            // Check for next page
            url = extractNextPageUrl(response.headers)
            if (url != null) {
                logger.debug { "Found next page URL, continuing pagination" }
            } else {
                logger.debug { "No more pages available" }
            }
        }

        logger.info { "Completed GitHub API search after $pageCount pages" }

        return when {
            latestVersion == null -> {
                logger.warn { "No valid versions found on GitHub" }
                null
            }
            latestVersion > currentVersionInfo -> {
                logger.info {
                    "Newer version available: ${latestVersion.originalVersion} > ${currentVersionInfo.originalVersion}"
                }
                latestVersion.originalVersion
            }
            else -> {
                logger.debug {
                    "Current version is up to date: ${currentVersionInfo.originalVersion} >= " +
                        latestVersion.originalVersion
                }
                null
            }
        }
    }

    private fun makeRequest(url: String): ResponseEntity<Array<GitHubTag>> {
        val headers = HttpHeaders().apply {
            set("Accept", "application/vnd.github.v3+json")
            set("User-Agent", "Version-Checker")
        }

        val entity = HttpEntity<String>(headers)

        logger.debug { "Making GitHub API request to: $url" }
        return restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            Array<GitHubTag>::class.java,
        ).also { response ->
            logger.debug {
                "GitHub API response: status=${response.statusCode}, body_size=${response.body?.size ?: 0}"
            }
        }
    }

    private fun extractNextPageUrl(headers: HttpHeaders): String? {
        val linkHeader = headers.getFirst("Link") ?: return null

        return linkHeader
            .split(",")
            .map { it.trim() }
            .find { it.contains("""rel="next"""") }
            ?.let { link ->
                val urlMatch = Regex("<([^>]+)>").find(link)
                urlMatch?.groupValues?.get(1)
            }
            ?.also { nextUrl ->
                logger.debug { "Extracted next page URL: $nextUrl" }
            }
    }

    private fun parseVersion(versionString: String): VersionInfo? {
        logger.debug { "Parsing version string: $versionString" }

        return when {
            // Beta version pattern: x.y.z-beta-n
            versionString.contains("-beta-") -> {
                val betaRegex = Regex("""^(\d+)\.(\d+)\.(\d+)-beta-(\d+)$""")
                val match = betaRegex.find(versionString)
                if (match == null) {
                    logger.debug { "Version string does not match beta pattern: $versionString" }
                    return null
                }
                val (major, minor, patch, betaNum) = match.destructured

                VersionInfo(
                    major = major.toInt(),
                    minor = minor.toInt(),
                    patch = patch.toInt(),
                    betaNumber = betaNum.toLong(),
                    originalVersion = versionString,
                ).also {
                    logger.debug {
                        "Parsed beta version: ${it.major}.${it.minor}.${it.patch}-beta-${it.betaNumber}"
                    }
                }
            }
            // Normal version pattern: x.y.z
            else -> {
                val normalRegex = Regex("""^(\d+)\.(\d+)\.(\d+)$""")
                val match = normalRegex.find(versionString)
                if (match == null) {
                    logger.debug {
                        "Version string does not match normal pattern: $versionString"
                    }
                    return null
                }
                val (major, minor, patch) = match.destructured

                VersionInfo(
                    major = major.toInt(),
                    minor = minor.toInt(),
                    patch = patch.toInt(),
                    originalVersion = versionString,
                ).also {
                    logger.debug { "Parsed stable version: ${it.major}.${it.minor}.${it.patch}" }
                }
            }
        }
    }

    // Optional: Method to clear cache manually if needed
    fun clearCache() {
        logger.info { "Clearing version check cache" }
        cachedResult = null
    }
}
