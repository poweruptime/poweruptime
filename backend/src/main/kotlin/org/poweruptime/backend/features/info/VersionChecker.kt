package org.poweruptime.backend.features.info

import org.springframework.http.HttpEntity
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpMethod
import org.springframework.http.ResponseEntity
import org.springframework.stereotype.Service
import org.springframework.web.client.RestTemplate
import java.time.Instant

data class GitHubTag(
    val name: String
)

data class VersionInfo(
    val major: Int,
    val minor: Int,
    val patch: Int,
    val betaNumber: Long? = null,
    val originalVersion: String
) : Comparable<VersionInfo> {
    val isBeta: Boolean get() = betaNumber != null

    override fun compareTo(other: VersionInfo): Int {
        // Compare major version first
        if (this.major != other.major) {
            return this.major.compareTo(other.major)
        }

        // Then minor version
        if (this.minor != other.minor) {
            return this.minor.compareTo(other.minor)
        }

        // Then patch version
        if (this.patch != other.patch) {
            return this.patch.compareTo(other.patch)
        }

        // If base versions are equal, non-beta > beta
        return when {
            !this.isBeta && other.isBeta -> 1
            this.isBeta && !other.isBeta -> -1
            this.isBeta && other.isBeta -> compareValues(this.betaNumber, other.betaNumber)
            else -> 0
        }
    }
}

private data class CachedVersionResult(
    val result: String?,
    val timestamp: Instant
)

@Service
class GitHubVersionChecker(
    private val restTemplate: RestTemplate,
    private val infoService: InfoService,
) {
    // Single cache entry with 30-minute expiration
    @Volatile
    private var cachedResult: CachedVersionResult? = null
    private val cacheExpirationMinutes = 30L

    fun checkForLatestVersion(currentVersion: String = infoService.version): String? {
        val now = Instant.now()

        // Check if we have a valid cached result
        cachedResult?.let { cached ->
            val cacheAge = java.time.Duration.between(cached.timestamp, now)
            if (cacheAge.toMinutes() < cacheExpirationMinutes) {
                return cached.result
            }
        }

        // Cache miss or expired - fetch new result
        val result = fetchLatestVersion(currentVersion)

        // Store in cache
        cachedResult = CachedVersionResult(result, now)

        return result
    }

    private fun fetchLatestVersion(currentVersion: String): String? {
        val currentVersionInfo = parseVersion(currentVersion)

        val isBetaChannel = currentVersionInfo!!.isBeta

        var url: String? = "https://api.github.com/repos/poweruptime/poweruptime/tags"
        var latestVersion: VersionInfo? = null

        while (url != null) {
            val response = makeRequest(url)
            val tags = response.body ?: emptyArray()

            // Filter and parse versions based on channel
            val validVersions = tags
                .mapNotNull { parseVersion(it.name) }
                .filter { it.isBeta == isBetaChannel }
                .sorted()
                .reversed() // Get latest first

            if (validVersions.isNotEmpty()) {
                latestVersion = validVersions.first()
                break
            }

            // Check for next page
            url = extractNextPageUrl(response.headers)
        }

        return when {
            latestVersion == null -> null
            latestVersion > currentVersionInfo -> latestVersion.originalVersion
            else -> null
        }
    }

    private fun makeRequest(url: String): ResponseEntity<Array<GitHubTag>> {
        val headers = HttpHeaders().apply {
            set("Accept", "application/vnd.github.v3+json")
            set("User-Agent", "Version-Checker")
        }

        val entity = HttpEntity<String>(headers)

        return restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            Array<GitHubTag>::class.java,
        )
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
    }

    private fun parseVersion(versionString: String): VersionInfo? {
        return when {
            // Beta version pattern: x.y.z-beta-n
            versionString.contains("-beta-") -> {
                val betaRegex = Regex("""^(\d+)\.(\d+)\.(\d+)-beta-(\d+)$""")
                val match = betaRegex.find(versionString) ?: return null
                val (major, minor, patch, betaNum) = match.destructured

                VersionInfo(
                    major = major.toInt(),
                    minor = minor.toInt(),
                    patch = patch.toInt(),
                    betaNumber = betaNum.toLong(),
                    originalVersion = versionString,
                )
            }
            // Normal version pattern: x.y.z
            else -> {
                val normalRegex = Regex("""^(\d+)\.(\d+)\.(\d+)$""")
                val match = normalRegex.find(versionString) ?: return null
                val (major, minor, patch) = match.destructured

                VersionInfo(
                    major = major.toInt(),
                    minor = minor.toInt(),
                    patch = patch.toInt(),
                    originalVersion = versionString,
                )
            }
        }
    }

    // Optional: Method to clear cache manually if needed
    fun clearCache() {
        cachedResult = null
    }
}
