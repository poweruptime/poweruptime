package org.poweruptime.backend.features.notification.domain

import org.poweruptime.backend.features.notification.model.Notification
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface NotificationRepository : JpaRepository<Notification, String>, JpaSpecificationExecutor<Notification>
