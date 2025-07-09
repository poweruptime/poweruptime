import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {catchError, map, of, take, tap} from 'rxjs';

import {IsSetupStore} from '@app/services';

export const isSetupGuard: CanActivateFn = (route) => {
  if (
    route.queryParams['mode']?.includes('preview') ||
    route.queryParams['preview'] !== undefined
  ) {
    return true;
  }

  const router = inject(Router);
  const isSetup$ = inject(IsSetupStore).isSetup$;

  return isSetup$.pipe(
    take(1),
    tap((isSetup) => {
      if (isSetup) {
        console.warn('isSetup');
      }
    }),
    map((isSetup) => isSetup || router.parseUrl('/auth/login')),
    catchError(() => of(false)),
  );
};
