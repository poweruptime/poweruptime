import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';

import {BreakpointObserver} from '@angular/cdk/layout';

import {map} from 'rxjs';

import {isMobileBreakpoints} from '@app/services/util';

export const isMobileGuard: CanActivateFn = (
  _: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);

  return inject(BreakpointObserver)
    .observe(isMobileBreakpoints)
    .pipe(
      map((result) => result.matches),
      map((isMobile) => {
        if (isMobile) {
          return true;
        }

        return router.parseUrl(state.url.replace('/mm', '/m'));
      }),
    );
};
