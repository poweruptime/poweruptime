import {Routes} from '@angular/router';

import {provideNgxMetaOpenGraph} from '@davidlj95/ngx-meta/open-graph';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('../outside.layout').then((c) => c.OutsideLayout),
    providers: [provideNgxMetaOpenGraph()],
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
