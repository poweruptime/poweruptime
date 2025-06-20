import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';

import {BreakpointObserver} from '@angular/cdk/layout';

import {map} from 'rxjs';

import {isMobileBreakpoints} from '@app/services/util';

export const isDesktopGuard: CanActivateFn = (
  _: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);

  return inject(BreakpointObserver)
    .observe(isMobileBreakpoints)
    .pipe(
      map((result) => !result.matches),
      map((isDesktop) => {
        if (isDesktop) {
          return true;
        }

        const index = state.url.indexOf('/m');
        if (state.url[index + 2] !== 'm') {
          return router.parseUrl(state.url.replace('/m', '/mm'));
        }
        return false;
      }),
    );
};
