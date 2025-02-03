import {DOCUMENT} from '@angular/common';
import {inject} from '@angular/core';
import {CanActivateFn, Router} from '@angular/router';

import {map, tap} from 'rxjs';

import {injectAPI} from '@app/api';

export const statusPageGuard: CanActivateFn = () => {
  const router = inject(Router);
  const localHost = inject(DOCUMENT).location.host;
  const api = injectAPI();

  return api.get('/v1/public/json').pipe(
    map((response) => response.host !== localHost),
    tap((isStatusPageDomain) => console.warn('isStatusPageDomain', isStatusPageDomain)),
    map((isStatusPageDomain) => isStatusPageDomain || router.parseUrl('/m')),
  );
};
