import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router} from '@angular/router';

import {AuthStore} from '@app/services';

export const isNotLoggedIn: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  if (inject(AuthStore).isLoggedIn()) {
    if (
      route.queryParams['mode']?.includes('preview') ||
      route.queryParams['preview'] !== undefined
    ) {
      return true;
    }
    return inject(Router).parseUrl('/');
  } else {
    return true;
  }
};
