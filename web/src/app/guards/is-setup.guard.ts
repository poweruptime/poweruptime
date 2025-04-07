import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {catchError, map, of, take, tap} from 'rxjs';

import {JsonService} from '@app/services/json.service';

export const isSetupGuard: CanActivateFn = (route) => {
  if (
    route.queryParams['mode']?.includes('preview') ||
    route.queryParams['preview'] !== undefined
  ) {
    return true;
  }

  const router = inject(Router);
  const json$ = inject(JsonService).json$;

  return json$.pipe(
    take(1),
    map(({setup}) => setup),
    tap((isSetup) => {
      if (isSetup) {
        console.warn('isSetup');
      }
    }),
    map((isSetup) => isSetup || router.parseUrl('/auth/login')),
    catchError(() => of(false)),
  );
};
