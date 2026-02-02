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
        @Suppress("DestructuringDeclarationWithTooManyEntries")
        fun fromString(versionString: String, commitUrl: String): VersionInfo? = when {
            // Beta version pattern: x.y.z-beta-n
            versionString.contains("-beta-") -> {
                val betaRegex = Regex("""^(\d+)\.(\d+)\.(\d+)-beta-(\d+)$""")
                val match = betaRegex.find(versionString)
                    ?: return null
                val (major, minor, patch, betaNum) = match.destructured

                VersionInfo(
                    major = major.toInt(),
                    minor = minor.toInt(),
                    patch = patch.toInt(),
                    betaNumber = betaNum.toLong(),
                    originalVersion = versionString,
                    commitUrl = commitUrl,
                )
            }

            // Normal version pattern: x.y.z
            else -> {
                val normalRegex = Regex("""^(\d+)\.(\d+)\.(\d+)$""")
                val match = normalRegex.find(versionString)
                    ?: return null
                val (major, minor, patch) = match.destructured

                VersionInfo(
                    major = major.toInt(),
                    minor = minor.toInt(),
                    patch = patch.toInt(),
                    originalVersion = versionString,
                    commitUrl = commitUrl,
                )
            }
        }
    }
}
