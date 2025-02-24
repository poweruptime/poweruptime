import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from '@angular/router';

import {loggerOf, s_fromStorage, st_remove, st_set} from 'dfts-helper';

const teamSelectedRedirectUrlKey = 'pu_team_select_redirect_url';
const logger = loggerOf('teamSelectGuard');

export const teamSelectedGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const router = inject(Router);

  const paramSelectedId = route.paramMap.get('teamId');
  if (paramSelectedId && paramSelectedId !== 'selectedTeamId') {
    const redirectUrl = s_fromStorage(teamSelectedRedirectUrlKey)?.replace(
      'selectedTeamId',
      paramSelectedId,
    );

    if (redirectUrl) {
      logger.info('', 'Found team redirect uri.', redirectUrl);

      st_remove(teamSelectedRedirectUrlKey);

      return router.parseUrl(redirectUrl);
    } else {
      logger.info('', 'Found team param', paramSelectedId);
    }

    return true;
  }

  logger.warning('', 'No team selected; Routing to select view');
  st_set(teamSelectedRedirectUrlKey, state.url);

  return router.parseUrl('/t');
};
