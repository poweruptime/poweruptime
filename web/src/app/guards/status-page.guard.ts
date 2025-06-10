import {DOCUMENT, inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {catchError, map, of, take, tap} from 'rxjs';

import {JsonStore} from '@app/services';

export const statusPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const localHost = inject(DOCUMENT).location.host;
  const json$ = inject(JsonStore).json$;

  return json$.pipe(
    take(1),
    map((response) => response.host !== localHost),
    tap((isStatusPageDomain) => {
      if (isStatusPageDomain) {
        console.warn('isStatusPageDomain');
      }
    }),
    map((isStatusPageDomain) => isStatusPageDomain || router.parseUrl('/m')),
    catchError(() => of(true)),
  );
};
