package org.poweruptime.backend.features.info.versionChecker

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
