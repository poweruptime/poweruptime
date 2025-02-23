package org.poweruptime.backend.features.fileUpload

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.Id
import jakarta.persistence.OneToOne
import jakarta.persistence.Table
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import org.poweruptime.backend.core.utils.RandomGenerator
import org.poweruptime.backend.features.statusPage.model.StatusPage

@Entity
@Table(name = "file")
class File(
    @Column(nullable = false, length = Database.MAX_FILE_NAME_LENGTH)
    @get:NotBlank
    @get:Size(min = Database.MIN_FILE_NAME_LENGTH, max = Database.MAX_FILE_NAME_LENGTH)
    val name: String,

    @Column(nullable = false, unique = true, length = NANO_ID_MAX_LENGTH)
    val fileId: String = RandomGenerator.nanoId(NANO_ID_MAX_LENGTH),

    @OneToOne(mappedBy = "image", fetch = FetchType.LAZY)
    val statusPage: StatusPage? = null,
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
