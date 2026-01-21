package org.poweruptime.backend.features.info.versionChecker.dto

import com.fasterxml.jackson.annotation.JsonProperty

data class GitHubCommit(val sha: String, val commit: Commit, val url: String)

data class Commit(
    val author: CommitAuthor,
    val committer: CommitAuthor,
    val message: String,
    val verification: Verification,
)

data class CommitAuthor(val name: String, val email: String, val date: String)

data class Verification(
    val verified: Boolean,
    val reason: String,
    val signature: String,
    val payload: String,
    @JsonProperty("verified_at")
    val verifiedAt: String,
)
