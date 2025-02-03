package org.poweruptime.backend.features.notification.core

import com.fasterxml.jackson.annotation.JsonIgnore
import com.fasterxml.jackson.annotation.JsonProperty
import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver
import jakarta.persistence.*
import org.poweruptime.backend.core.SmallNanoId
import org.poweruptime.backend.core.models.ASoftDeleteEntity
import org.poweruptime.backend.core.utils.NANO_ID_SMALL_LENGTH

/**
 * Base entity for a NotificationSenderData.
 */
@Entity(name = "notification_sender_data")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "_type", discriminatorType = DiscriminatorType.STRING)
@JsonTypeInfo(use = JsonTypeInfo.Id.CLASS, include = JsonTypeInfo.As.PROPERTY, property = "_type")
@JsonTypeIdResolver(NotificationSenderDataTypeResolver::class)
abstract class NotificationSenderData(
    /**
     * This maps the discriminator column to a read-only property.
     * It's marked as insertable = false, updatable = false because the discriminator
     * should be controlled by the inheritance mapping, not manually.
     */
    @Column(name = "_type", insertable = false, updatable = false)
    @Suppress("PropertyName", "ConstructorParameterNaming")
    @JsonProperty("_type")
    open val _type: NotificationSenderType
) : ASoftDeleteEntity() {
    @Id
    @SmallNanoId
    @Column(name = "id", unique = true, length = NANO_ID_SMALL_LENGTH)
    @JsonIgnore
    override lateinit var id: String
}
