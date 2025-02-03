package org.poweruptime.backend.features.statusPage.domain

import org.poweruptime.backend.features.statusPage.model.StatusPageGroup
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface StatusPageGroupRepository :
    org.poweruptime.backend.core.domain.Repository<StatusPageGroup>,
    JpaSpecificationExecutor<StatusPageGroup>
