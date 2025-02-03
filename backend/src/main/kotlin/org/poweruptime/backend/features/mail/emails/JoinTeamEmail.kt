package org.poweruptime.backend.features.mail.emails

import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.mail.Email
import org.poweruptime.backend.features.team.model.Team
import org.thymeleaf.context.Context

data class JoinTeamEmail(val inviterTeam: Team, val inviter: User, val invitee: User, val token: String) : Email {
    override val to = invitee.email

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
