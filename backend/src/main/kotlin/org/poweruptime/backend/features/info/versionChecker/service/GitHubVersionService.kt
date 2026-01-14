package org.poweruptime.backend.features.info.versionChecker.service

import io.github.oshai.kotlinlogging.KotlinLogging
import org.poweruptime.backend.features.info.InfoService
import org.poweruptime.backend.features.info.versionChecker.dto.GitHubCommit
import org.poweruptime.backend.features.info.versionChecker.dto.GitHubTag
import org.poweruptime.backend.features.info.versionChecker.dto.VersionCheckResponse
import org.poweruptime.backend.features.info.versionChecker.dto.VersionInfo
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.toEntity

@Service
class GitHubVersionService(
    private val restClient: RestClient,
    private val infoService: InfoService,
) {
    private final val logger = KotlinLogging.logger {}

    @Suppress("LongMethod", "LoopWithTooManyJumpStatements")
    fun fetchLatestVersion(currentVersion: String): VersionCheckResponse? {
        val currentVersionInfo = VersionInfo.fromString(currentVersion, "INVALID_URL")
        if (currentVersionInfo == null) {
            logger.error { "Could not parse current version: $currentVersion" }
            return null
        }

        val isBetaChannel = currentVersionInfo.isBeta
        logger.debug {
            "Checking for updates on ${if (isBetaChannel) "beta" else "stable"} channel"
        }

        var url: String? = "https://api.github.com/repos/poweruptime/poweruptime/tags"
        var latestVersion: VersionInfo? = null
        var latestVersionCommitUrl: String? = null
        var pageCount = 0

        while (url != null) {
            pageCount++
            logger.debug { "Fetching GitHub tags page $pageCount from: $url" }

            val (tags, linkHeader) = try {
                makeRequest(url)
            } catch (e: Exception) {
                logger.error { "Failed to fetch GitHub tags from URL: $url, ex: $e" }
                break
            }

            logger.debug { "Retrieved ${tags.size} tags from page $pageCount" }

            // Filter and parse versions based on channel
            val validVersions = tags
                .mapNotNull { tag ->
                    VersionInfo.fromString(tag.name, tag.commit.url).also { version ->
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
                latestVersionCommitUrl = latestVersion.commitUrl

                logger.debug { "Latest version found: ${latestVersion.originalVersion}" }
                break
            }

            // Check for next page
            url = extractNextPageUrl(linkHeader)
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
                VersionCheckResponse(
                    version = latestVersion.originalVersion,
                    date = makeCommitRequest(latestVersionCommitUrl!!)?.commit?.author?.date ?: "Unknown",
                )
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

    private fun makeCommitRequest(url: String): GitHubCommit? {
        logger.debug { "Making GitHub API request to: $url" }

        val response = restClient
            .get()
            .uri(url)
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "poweruptime-${infoService.version}-versionChecker")
            .retrieve()
            .toEntity<GitHubCommit>()

        logger.debug {
            "GitHub API response: status=${response.statusCode}"
        }

        return response.body
    }

    private fun makeRequest(url: String): Pair<Array<GitHubTag>, String?> {
        logger.debug { "Making GitHub API request to: $url" }

        val response = restClient
            .get()
            .uri(url)
            .header("Accept", "application/vnd.github.v3+json")
            .header("User-Agent", "poweruptime-${infoService.version}-versionChecker")
            .retrieve()
            .toEntity<Array<GitHubTag>>()

        logger.debug {
            "GitHub API response: status=${response.statusCode}, " +
                "body_size=${response.body?.size ?: 0}"
        }

        val linkHeader = response.headers.getFirst("Link")
        return Pair(response.body ?: emptyArray(), linkHeader)
    }

    private fun extractNextPageUrl(linkHeader: String?): String? {
        if (linkHeader == null) return null

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
}
