package org.poweruptime.backend.features.authentication.model

import jakarta.persistence.CascadeType
import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.hibernate.annotations.ColumnDefault
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator

@Entity
@Table(
    name = "mfa_backup_code",
    uniqueConstraints = [UniqueConstraint(columnNames = ["mfa_id", "code"])],
)
class MFABackupCode(
    @ManyToOne(fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    @JoinColumn(name = "mfa_id", nullable = false)
    val mfa: MFA,

    @ColumnDefault("true")
    @Column(nullable = false, columnDefinition = "boolean")
    var valid: Boolean = true,

    @Column(name = "code", nullable = false, length = NANO_ID_MAX_LENGTH)
    val code: String = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
