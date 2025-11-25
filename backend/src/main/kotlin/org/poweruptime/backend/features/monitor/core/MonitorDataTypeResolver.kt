package org.poweruptime.backend.features.monitor.core

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.DatabindContext
import com.fasterxml.jackson.databind.JavaType
import com.fasterxml.jackson.databind.jsontype.impl.TypeIdResolverBase

class MonitorDataTypeResolver : TypeIdResolverBase() {
    private lateinit var superType: JavaType

    override fun init(baseType: JavaType) {
        superType = baseType
    }

    override fun getMechanism(): JsonTypeInfo.Id = JsonTypeInfo.Id.NAME

    override fun typeFromId(context: DatabindContext, id: String): JavaType =
        context.constructSpecializedType(
            superType,
            MonitorData.forType(id).java,
        )

    override fun idFromValue(value: Any?): String =
        MonitorData.forClass(value?.javaClass?.kotlin)

    override fun idFromValueAndType(value: Any?, suggestedType: Class<*>?): String =
        MonitorData.forClass(value?.javaClass?.kotlin)
}
