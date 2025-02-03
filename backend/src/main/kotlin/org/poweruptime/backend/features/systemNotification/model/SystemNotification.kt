package org.poweruptime.backend.features.systemNotification.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table
import org.hibernate.annotations.ColumnDefault
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH
import java.time.Instant

@Entity
@Table(name = "system_notification")
class SystemNotification(
    @Column(nullable = true, length = 100)
    var title: String?,

    @Column(nullable = false, length = 2000)
    var description: String,

    @ColumnDefault("true")
    @Column(nullable = false, columnDefinition = "boolean")
    var active: Boolean = true,

    @Column(nullable = false, length = 1)
    var type: SystemNotificationType,

    @Column(columnDefinition = "timestamptz")
    var starts: Instant?,

    @Column(columnDefinition = "timestamptz")
    var ends: Instant?,
) : AEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    override lateinit var id: String

    companion object
}
