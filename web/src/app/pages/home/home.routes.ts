import {Routes} from '@angular/router';

import {isSystemAdmin} from '@app/guards/is-system-admin.guard';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.layout').then((c) => c.HomeLayout),
    children: [
      {
        path: 'm',
        loadComponent: () => import('./monitor/monitors.page').then((c) => c.MonitorsPage),
        children: [
          {
            path: ':monitorId',
            loadChildren: () => import('./monitor/monitor-detail.routes').then((r) => r.ROUTES),
          },
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./monitor/monitors-dashboard.page').then((c) => c.MonitorsDashboardPage),
          },
        ],
      },
      {
        path: 'settings',
        canActivate: [isSystemAdmin],
        loadChildren: () =>
          import('./instance-settings/instance-settings.routes').then((r) => r.ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.routes').then((r) => r.ROUTES),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'm',
      },
    ],
  },
  {
    path: 't',
    loadChildren: () => import('./team.routes').then((it) => it.ROUTES),
  },
];
