import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../outside.layout').then((c) => c.OutsideLayout),
    children: [
      {
        path: 'm/:monitorId',
        loadComponent: () => import('./public-monitor.page').then((c) => c.PublicMonitorPage),
      },
      {
        path: 's/:statusPageSlug',
        loadComponent: () =>
          import('./public-status-page.page').then((c) => c.PublicStatusPagePage),
      },
    ],
  },
];
