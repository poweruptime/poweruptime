import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {catchError, map, of, take} from 'rxjs';

import {JsonService} from '@app/services/json.service';

export const isNotSetupGuard: CanActivateFn = (route) => {
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
    map((isSetup) => !isSetup || router.parseUrl('/setup')),
    catchError(() => of(true)),
  );
};
