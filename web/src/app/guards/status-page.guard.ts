import {DOCUMENT, inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {catchError, map, of, take, tap} from 'rxjs';

import {InfoStore} from '@app/services';

export const statusPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const localHost = inject(DOCUMENT).location.host;
  const infoStore = inject(InfoStore);

  infoStore.loadHost();

  return infoStore.host$.pipe(
    take(1),
    map((host) => {
      if (localHost === 'localhost:4200' || localHost === '0.0.0.0:4200') {
        return false;
      }
      return host !== localHost;
    }),
    tap((isStatusPageDomain) => {
      if (isStatusPageDomain) {
        console.warn('isStatusPageDomain');
      }
    }),
    map((isStatusPageDomain) => isStatusPageDomain || router.parseUrl('/m')),
    catchError(() => of(true)),
  );
};
