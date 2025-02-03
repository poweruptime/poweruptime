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
            children: [
              {
                path: '',
                loadComponent: () =>
                  import('./monitor/monitor-detail.page').then((c) => c.MonitorDetailPage),
                pathMatch: 'full',
              },
              {
                path: 'c/:checkResultId/logs',
                loadComponent: () =>
                  import('./monitor/monitor-check-result-detail.page').then(
                    (c) => c.MonitorCheckResultDetailPage,
                  ),
              },
            ],
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
    ],
  },
  {
    path: 't',
    loadChildren: () => import('./team.routes').then((it) => it.ROUTES),
  },
];
