import {inject} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {CanActivateFn, Router} from '@angular/router';

import {filter, map, take} from 'rxjs';

import {loggerOf} from 'dfts-helper';

import {ProfileStore} from '@app/services';

const logger = loggerOf('isSystemAdminGuard');

export const isSystemAdmin: CanActivateFn = () => {
  const router = inject(Router);

  return toObservable(inject(ProfileStore).role).pipe(
    filter((it) => !!it),
    map((it) => {
      const isAdmin = it === 'ADMIN';
      if (!isAdmin) {
        return router.parseUrl('/');
      }

      logger.info('check', `isSystemAdmin: ${isAdmin}`);

      return true;
    }),
    take(1),
  );
};
