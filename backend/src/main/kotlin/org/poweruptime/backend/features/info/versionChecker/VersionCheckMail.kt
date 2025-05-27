package org.poweruptime.backend.features.info.versionChecker

import jakarta.persistence.*
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH

@Entity
@Table(name = "version_check_mail")
class VersionCheckMail(
    @Column(name = "pu_version", nullable = false, length = 21, unique = true)
    val puVersion: String,
) : AEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String
}
