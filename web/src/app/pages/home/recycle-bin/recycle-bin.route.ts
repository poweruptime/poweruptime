import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./recycle-bin.layout').then((c) => c.RecycleBinLayout),
    children: [
      {
        path: 'monitor',
        loadComponent: () =>
          import('./recycle-bin-monitor.page').then((c) => c.RecycleBinMonitorPage),
      },
      {
        path: 'status-page',
        loadComponent: () =>
          import('./recycle-bin-status-page.page').then((c) => c.RecycleBinStatusPagePage),
      },
      {
        path: 'notification-method',
        loadComponent: () =>
          import('./recycle-bin-notification-method.page').then(
            (c) => c.RecycleBinNotificationMethodPage,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'monitor',
      },
      {
        path: '**',
        redirectTo: 'monitor',
      },
    ],
  },
];
