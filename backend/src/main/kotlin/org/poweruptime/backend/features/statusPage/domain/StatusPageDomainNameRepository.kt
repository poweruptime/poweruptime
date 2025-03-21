package org.poweruptime.backend.features.statusPage.domain

import org.poweruptime.backend.features.statusPage.model.StatusPageDomainName
import org.springframework.data.jpa.repository.JpaSpecificationExecutor
import org.springframework.stereotype.Repository

@Repository
interface StatusPageDomainNameRepository :
    org.poweruptime.backend.core.domain.Repository<StatusPageDomainName>,
    JpaSpecificationExecutor<StatusPageDomainName>
