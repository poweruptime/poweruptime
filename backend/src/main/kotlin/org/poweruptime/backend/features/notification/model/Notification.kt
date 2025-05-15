package org.poweruptime.backend.features.notification.model

import jakarta.persistence.*
import org.hibernate.annotations.OnDelete
import org.hibernate.annotations.OnDeleteAction
import org.poweruptime.backend.core.DefaultNanoId
import org.poweruptime.backend.core.models.AEntity
import org.poweruptime.backend.core.utils.NANO_ID_DEFAULT_LENGTH
import org.poweruptime.backend.features.monitor.model.CheckResult

@Entity
@Table(name = "notification")
class Notification(
    @JoinColumn(name = "check_result_id", nullable = false, referencedColumnName = "id")
    @ManyToOne(fetch = FetchType.LAZY)
    @OnDelete(action = OnDeleteAction.CASCADE)
    val checkResult: CheckResult,

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "notification")
    val subNotifications: List<SubNotification> = ArrayList(),
) : AEntity() {
    @Id
    @DefaultNanoId
    @Column(name = "id", unique = true, length = NANO_ID_DEFAULT_LENGTH)
    override lateinit var id: String
}
