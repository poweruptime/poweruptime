package org.poweruptime.backend.features.mail.service

import org.poweruptime.backend.features.HostService
import org.poweruptime.backend.features.mail.Email
import org.poweruptime.backend.features.mail.EmailTemplateResponse
import org.springframework.stereotype.Service
import org.thymeleaf.TemplateEngine
import org.thymeleaf.context.Context

@Service
class EmailTemplateService(private val templateEngine: TemplateEngine, private val hostService: HostService) {
    fun getRenderedMail(email: Email): EmailTemplateResponse {
        val context = email.context.applyDefaultContext(email.subject)
        return EmailTemplateResponse(
            plain = templateEngine.process(
                "txt/${email.templateName}.txt",
                context,
            ),
            html = templateEngine.process(
                "html/${email.templateName}.html",
                context,
            ),
        )
    }

    private fun Context.applyDefaultContext(subject: String) = this.apply {
        setVariable("host", hostService.host)
        setVariable("urlHost", hostService.urlHost)
        setVariable("metaTitle", subject)
    }
}
