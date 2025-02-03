package org.poweruptime.backend.features.authentication

import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.exceptions.ForbiddenException
import org.poweruptime.backend.core.exceptions.UnauthorizedException

class AccountNotActivatedException : ForbiddenException("Account not activated", "account_not_activated")

class SessionTokenIncorrectException : UnauthorizedException("Session token incorrect", "session_token_incorrect")

class SessionInformationMissingException : BadRequestException(
    "Session information is missing",
    "session_information_missing",
)

class PasswordChangeRequiredException : ForbiddenException("Password change required", "password_change_required")

class NoPasswordChangeRequiredException :
    ForbiddenException("No password change required", "no_password_change_required")

class PasswordChangeIdenticalException :
    ForbiddenException("The new password is equals to the old one.", "passwords_identical")
