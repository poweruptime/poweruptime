import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';

import {AuthStore} from '@app/services';

export const isLoggedIn: CanActivateFn = (
  _: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authStore = inject(AuthStore);

  if (authStore.isLoggedIn()) {
    return true;
  } else {
    authStore.setRedirectUrl(state.url);

    return inject(Router).parseUrl('/auth/login');
  }
};
