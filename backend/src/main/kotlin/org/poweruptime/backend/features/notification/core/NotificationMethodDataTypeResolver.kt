package org.poweruptime.backend.features.notification.core

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.DatabindContext
import com.fasterxml.jackson.databind.JavaType
import com.fasterxml.jackson.databind.jsontype.impl.TypeIdResolverBase

class NotificationMethodDataTypeResolver : TypeIdResolverBase() {
    private val notificationMethodDataTypeFactory = NotificationMethodDataTypeFactory()

    private lateinit var superType: JavaType

    override fun init(baseType: JavaType) {
        superType = baseType
    }

    override fun getMechanism() = JsonTypeInfo.Id.NAME

    override fun typeFromId(context: DatabindContext, id: String): JavaType =
        context.constructSpecializedType(
            superType,
            notificationMethodDataTypeFactory.toClass(id),
        )

    override fun idFromValue(value: Any?): String =
        notificationMethodDataTypeFactory.toStringRepresentation(value?.javaClass)

    override fun idFromValueAndType(value: Any?, suggestedType: Class<*>?): String =
        notificationMethodDataTypeFactory.toStringRepresentation(value?.javaClass)
}
