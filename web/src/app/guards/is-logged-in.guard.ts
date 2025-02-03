import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';

import {AuthStore} from '@app/services';

export const isLoggedIn: CanActivateFn = (
  _: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthStore);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    authService.setRedirectUrl(state.url);

    return inject(Router).parseUrl('/auth/login');
  }
};
