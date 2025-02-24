package org.poweruptime.backend.features.authentication.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.OneToMany
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import org.hibernate.annotations.ColumnDefault
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import java.util.ArrayList

@Entity
@Table(name = "mfa")
class MFA(
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(name = "secret", nullable = false, length = 10)
    val secret: String = RandomGenerator.nanoId(10),

    @ColumnDefault("false")
    @Column(nullable = false, columnDefinition = "boolean")
    var active: Boolean = false,

    @OneToMany(fetch = FetchType.LAZY, cascade = [CascadeType.ALL], mappedBy = "mfa")
    val backupCodes: List<MFABackupCode> = ArrayList()
) : AEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String
}
