import {Routes} from '@angular/router';

import {environment} from '../../../../environments/environment';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile.layout').then((c) => c.ProfileLayout),
    children: [
      {
        path: 'overview',
        loadComponent: () => import('./profile-overview.page').then((c) => c.ProfileOverviewPage),
      },
      {
        path: 'security',
        loadComponent: () => import('./profile-security.page').then((c) => c.ProfileSecurityPage),
      },
      {
        path: 'dev',
        canActivate: [() => !environment.production],
        loadComponent: () => import('./profile-dev.page').then((c) => c.ProfileDevPage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
      {
        path: '**',
        redirectTo: 'overview',
      },
    ],
  },
];
