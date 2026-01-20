package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.UserRecord
import org.poweruptime.backend.features.mail.Email
import org.poweruptime.backend.features.team.model.TeamRecord
import org.thymeleaf.context.Context

data class JoinTeamEmail(
    val inviterTeam: TeamRecord,
    val inviter: UserRecord,
    val invitee: UserRecord,
    val token: String,
    override val cc: Set<String>? = null,
    override val bcc: Set<String>? = null,
) : Email {
    override val to = setOf(invitee.email)

    override val subject = "Join the ${inviterTeam.name} team on poweruptime"

    override val context = Context().apply {
        setVariable("inviterTeam", inviterTeam.name)
        setVariable("inviterName", inviter.name)
        setVariable("inviterEmail", inviter.email)
        setVariable("inviteeName", invitee.name)
        setVariable("inviteeEmail", invitee.email)
        setVariable("token", token)
    }

    override val templateName = "join-team"
}
