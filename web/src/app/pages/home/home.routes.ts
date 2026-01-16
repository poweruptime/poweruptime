import {Routes} from '@angular/router';

import {isDesktopGuard} from '@app/guards/is-desktop.guard';
import {isMobileGuard} from '@app/guards/is-mobile.guard';
import {isSystemAdmin} from '@app/guards/is-system-admin.guard';
import {MonitorsDashboardStore, MonitorsStore, TagsStore} from '@app/services';
import {environment} from '@app/util';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.layout').then((c) => c.HomeLayout),
    children: [
      {
        path: 'm',
        loadComponent: () => import('./monitor/monitors.page').then((c) => c.MonitorsPage),
        canActivate: [isDesktopGuard],
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
        path: 'mm',
        canActivate: [isMobileGuard],
        providers: [MonitorsStore, MonitorsDashboardStore, TagsStore],
        children: [
          {
            path: ':monitorId',
            loadChildren: () => import('./monitor/monitor-detail.routes').then((r) => r.ROUTES),
          },
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./monitor/mobile-monitors-dashboard.page').then(
                (c) => c.MobileMonitorsDashboardPage,
              ),
          },
        ],
      },
      {
        path: 'settings',
        canActivate: [isSystemAdmin],
        data: {
          breadcrumb: 'nav.instanceSettings',
        },
        loadChildren: () =>
          import('./instance-settings/instance-settings.routes').then((r) => r.ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () => import('./profile/profile.routes').then((r) => r.ROUTES),
      },
      {
        path: 'dev',
        canActivate: [() => environment.channel === 'dev'],
        loadComponent: () => import('./dev.page').then((c) => c.DevPage),
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
