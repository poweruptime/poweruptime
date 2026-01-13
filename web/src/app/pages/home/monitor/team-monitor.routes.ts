import {Routes} from '@angular/router';

import {MonitorDetailStore} from '../../../services';

export const ROUTES: Routes = [
  {
    path: 'new',
    providers: [MonitorDetailStore],
    loadComponent: () => import('./monitor-edit.page').then((c) => c.MonitorEditPage),
  },
  {
    path: ':monitorId',
    loadChildren: () => import('./monitor-detail.routes').then((r) => r.ROUTES),
  },
];
