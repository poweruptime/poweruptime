package org.poweruptime.backend.features.authentication.service

import dev.turingcomplete.kotlinonetimepassword.GoogleAuthenticator
import jakarta.transaction.Transactional
import org.apache.commons.codec.binary.Base32
import org.poweruptime.backend.core.exceptions.BadRequestException
import org.poweruptime.backend.core.service.AEntityService
import org.poweruptime.backend.features.authentication.MFACodeIncorrectException
import org.poweruptime.backend.features.authentication.MFACodeRequiredException
import org.poweruptime.backend.features.authentication.domain.MFABackupCodeRepository
import org.poweruptime.backend.features.authentication.domain.MFARepository
import org.poweruptime.backend.features.authentication.model.MFA
import org.poweruptime.backend.features.authentication.model.MFABackupCode
import org.poweruptime.backend.features.authentication.model.User
import org.poweruptime.backend.features.user.domain.UserRepository
import org.springframework.stereotype.Service
import kotlin.jvm.Throws

@Service
class MFAService(
    private val mfaRepository: MFARepository,
    private val mfaBackupCodeRepository: MFABackupCodeRepository,
    private val userRepository: UserRepository,
) : AEntityService<MFA>(mfaRepository) {

    fun getBackupCodesByMFAId(mfaId: String) = mfaBackupCodeRepository.findByMFAId(mfaId)

    fun getByUserId(userId: String) = mfaRepository.findByUserId(userId)

    @Throws(MFACodeIncorrectException::class, MFACodeRequiredException::class)
    fun validate(userId: String, code: String?) {
        mfaRepository.findByUserId(userId)?.let {
            if (!it.active) {
                return
            }

            if (code == null) {
                throw MFACodeRequiredException()
            }

            if (!isValid(it.secret, code)) {
                val backupCode = mfaBackupCodeRepository.findValidByMFAIdAndCode(it.id, code)
                    ?: throw MFACodeIncorrectException()

                mfaBackupCodeRepository.invalidateCode(backupCode.id)
            }
        }
    }

    @Transactional
    fun create(user: User): MFA {
        mfaRepository.findByUserId(user.id)?.let {
            if (it.active) {
                throw BadRequestException("MFA already confirmed")
            }

            return it
        }

        val mfa = save(MFA(user = user, active = false))

        mfaBackupCodeRepository.saveAll(buildList { repeat(10) { add(MFABackupCode(mfa = mfa)) } })

        return mfa
    }

    @Transactional
    fun activate(userId: String, code: String): MFA {
        val mfa = mfaRepository.findByUserId(userId) ?: throw BadRequestException("Setup MFA first")

        if (mfa.active) {
            throw BadRequestException("MFA already active")
        }

        if (!isValid(mfa.secret, code)) {
            throw BadRequestException("Code invalid")
        }

        mfa.active = true
        return save(mfa)
    }

    @Transactional
    fun delete(user: User) {
        mfaRepository.findByUserId(user.id)?.let { mfa ->
            mfaBackupCodeRepository.findByMFAId(mfa.id).forEach {
                mfaBackupCodeRepository.deleteById(it.id)
            }

            user.mfa = null
            userRepository.saveAndFlush(user)

            deleteById(mfa.id)

            mfaBackupCodeRepository.flush()
            flush()
        }
    }

    fun toBase32EncodedString(secret: String): String = Base32().encodeToString(secret.toByteArray(Charsets.UTF_8))

    private fun isValid(secret: String, code: String): Boolean {
        val plainTextSecret = secret.toByteArray(Charsets.UTF_8)
        val base32EncodedSecret = Base32().encode(plainTextSecret)

        return GoogleAuthenticator(base32secret = base32EncodedSecret).isValid(code)
    }
}
