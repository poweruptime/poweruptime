package org.poweruptime.backend.features.notification.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.MaxNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.Database
import org.poweruptime.backend.core.utils.NANO_ID_MAX_LENGTH
import java.time.Instant

@Entity
@Table(name = "sub_notification")
class SubNotification(
    @JoinColumn(name = "notification_id", nullable = false, referencedColumnName = "id")
    @ManyToOne(fetch = FetchType.EAGER, cascade = [CascadeType.ALL])
    @OnDelete(action = OnDeleteAction.CASCADE)
    val notification: Notification,

    @JoinColumn(name = "notification_method_id", nullable = false, referencedColumnName = "id")
    @ManyToOne
    @OnDelete(action = OnDeleteAction.CASCADE)
    val method: NotificationMethod,

    @Column(name = "title", nullable = false, length = Database.MAX_TITLE_LENGTH)
    var title: String,

    @Column(name = "message", nullable = true, length = Database.MAX_MESSAGE_LENGTH)
    var message: String? = null,

    @Column(name = "picked_up_at", columnDefinition = "timestamptz", nullable = true)
    var pickedUpAt: Instant? = null,

    @Column(name = "sent_at", columnDefinition = "timestamptz", nullable = true)
    var sentAt: Instant? = null,

    @Column(name = "error", length = Database.MAX_MESSAGE_LENGTH, nullable = true)
    var error: String? = null,
) : AEntity() {
    @Id
    @MaxNanoId
    @Column(name = "id", unique = true, length = NANO_ID_MAX_LENGTH)
    override lateinit var id: String
}
