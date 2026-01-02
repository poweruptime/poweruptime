package org.poweruptime.backend.features.info.versionChecker.dto

data class GitHubTag(
    val name: String,
    val commit: MinGitHubCommit
)

data class MinGitHubCommit(
    val sha: String,
    val url: String,
)
