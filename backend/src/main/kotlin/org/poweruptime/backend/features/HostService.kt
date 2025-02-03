package org.poweruptime.backend.features

import org.poweruptime.backend.core.utils.Config
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

@Service
class HostService(
    @Value(Config.HOST) val host: String = "localhost:4200",
) {
    val urlHost = "http${if (host.contains("localhost")) "" else "s"}://$host"
}
