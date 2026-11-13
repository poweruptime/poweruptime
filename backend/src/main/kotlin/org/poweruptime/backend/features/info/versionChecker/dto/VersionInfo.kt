package org.poweruptime.backend.features.info.versionChecker.dto

class VersionInfo(
    val major: Int,
    val minor: Int,
    val patch: Int,
    val betaNumber: Long? = null,
    val originalVersion: String,
    val commitUrl: String,
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

    companion object {
        private val versionPattern = Regex("""^(\d+)\.(\d+)\.(\d+)(?:-beta([.-])(\d+))?$""")

        fun fromString(versionString: String, commitUrl: String): VersionInfo? {
            val match = versionPattern.matchEntire(versionString) ?: return null
            val major = match.groupValues[1].toIntOrNull() ?: return null
            val minor = match.groupValues[2].toIntOrNull() ?: return null
            val patch = match.groupValues[3].toIntOrNull() ?: return null
            val beta = match.groupValues[5].takeIf { it.isNotEmpty() }
            val betaNumber = beta?.toLongOrNull()
            if (beta != null && betaNumber == null) return null
            return VersionInfo(major, minor, patch, betaNumber, versionString, commitUrl)
        }
    }
}
