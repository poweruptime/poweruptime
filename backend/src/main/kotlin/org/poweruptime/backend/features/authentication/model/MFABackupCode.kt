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
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH

@Entity
@Table(
    name = "mfa_backup_code",
    uniqueConstraints = [UniqueConstraint(columnNames = ["mfa_id", "code_hash"])],
)
class MFABackupCode(
    @ManyToOne(fetch = FetchType.LAZY, cascade = [CascadeType.ALL])
    @JoinColumn(name = "mfa_id", nullable = false)
    val mfa: MFA,

    @Column(name = "code_hash", nullable = false, length = Database.MAX_BCRYPT_LENGTH)
    val codeHash: String,

    @ColumnDefault("true")
    @Column(nullable = false, columnDefinition = "boolean")
    var valid: Boolean = true,
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
