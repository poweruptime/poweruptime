import {DOCUMENT} from '@angular/common';
import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {catchError, map, of, tap} from 'rxjs';

import {injectAPI} from '@app/api';

export const statusPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const localHost = inject(DOCUMENT).location.host;
  const api = injectAPI();

  return api.get('/v1/public/json').pipe(
    tap((res) => console.log('Instance information', res)),
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
