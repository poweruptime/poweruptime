package org.poweruptime.backend.features.deadLetter

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH

@Entity
@Table(name = "dead_letter")
class DeadLetter(
    @Column(nullable = false, length = 255)
    val queue: String,

    @Column(nullable = false, length = 255)
    val exchange: String,

    @Column(nullable = false, columnDefinition = "text")
    val body: String,
) : AEntity() {
    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String
}
