package org.poweruptime.backend.features.monitor.core

import com.fasterxml.jackson.annotation.JsonTypeInfo
import com.fasterxml.jackson.databind.DatabindContext
import com.fasterxml.jackson.databind.JavaType
import com.fasterxml.jackson.databind.jsontype.impl.TypeIdResolverBase

class MonitorCheckerDataTypeResolver : TypeIdResolverBase() {
    private val monitorCheckerDataTypeFactory = MonitorCheckerDataTypeFactory()

    private lateinit var superType: JavaType

    override fun init(baseType: JavaType) {
        superType = baseType
    }

    override fun getMechanism() = JsonTypeInfo.Id.NAME

    override fun typeFromId(context: DatabindContext, id: String): JavaType =
        context.constructSpecializedType(
            superType,
            monitorCheckerDataTypeFactory.toClass(id),
        )

    override fun idFromValue(value: Any?): String =
        monitorCheckerDataTypeFactory.toStringRepresentation(value?.javaClass)

    override fun idFromValueAndType(value: Any?, suggestedType: Class<*>?): String =
        monitorCheckerDataTypeFactory.toStringRepresentation(value?.javaClass)
}
