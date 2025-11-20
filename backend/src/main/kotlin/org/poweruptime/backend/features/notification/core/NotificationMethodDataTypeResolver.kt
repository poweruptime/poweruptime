package org.poweruptime.backend.features.notification.core

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.DatabindContext
import com.fasterxml.jackson.databind.JavaType
import com.fasterxml.jackson.databind.jsontype.impl.TypeIdResolverBase
import org.poweruptime.backend.features.notification.model.NotificationMethodData

class NotificationMethodDataTypeResolver : TypeIdResolverBase() {
    private lateinit var superType: JavaType

    override fun init(baseType: JavaType) {
        superType = baseType
    }

    override fun getMechanism() = JsonTypeInfo.Id.NAME

    override fun typeFromId(context: DatabindContext, id: String): JavaType =
        context.constructSpecializedType(
            superType,
            NotificationMethodData.forType(id).java,
        )

    override fun idFromValue(value: Any?): String =
        NotificationMethodData.forClass(value?.javaClass?.kotlin)

    override fun idFromValueAndType(value: Any?, suggestedType: Class<*>?): String =
        NotificationMethodData.forClass(value?.javaClass?.kotlin)
}
