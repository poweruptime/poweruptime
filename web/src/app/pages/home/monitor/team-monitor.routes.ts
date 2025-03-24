import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () => import('./monitor-edit.page').then((c) => c.MonitorEditPage),
  },
  {
    path: ':monitorId/edit',
    loadComponent: () => import('./monitor-edit.page').then((c) => c.MonitorEditPage),
  },
  {
    path: ':monitorId',
    loadChildren: () => import('./monitor-detail.routes').then((r) => r.ROUTES),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./monitors-dashboard.page').then((c) => c.MonitorsDashboardPage),
  },
];
