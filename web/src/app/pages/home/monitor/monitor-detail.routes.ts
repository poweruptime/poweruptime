import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./monitor-detail.page').then((c) => c.MonitorDetailPage),
    pathMatch: 'full',
  },
  {
    path: 'c/:checkResultId/logs',
    loadComponent: () =>
      import('./monitor-check-result-detail.page').then((c) => c.MonitorCheckResultDetailPage),
  },
  {
    path: 'n/:notificationId',
    loadComponent: () =>
      import('./monitor-notification-detail.page').then((c) => c.MonitorNotificationDetailPage),
  },
];
