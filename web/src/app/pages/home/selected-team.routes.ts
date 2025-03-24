import {Routes} from '@angular/router';

import {NotificationMethodsStore, StatusPagesStore} from '@app/services';

export const ROUTES: Routes = [
  {
    path: 'edit',
    loadComponent: () => import('./team/team-edit.page').then((c) => c.TeamEditPage),
  },
  {
    path: 'invite',
    loadComponent: () => import('./team/team-invite.page').then((c) => c.TeamInvitePage),
  },
  {
    path: 'notification-methods',
    providers: [NotificationMethodsStore],
    loadChildren: () =>
      import('./notification-methods/notification-methods.routes').then((r) => r.ROUTES),
  },
  {
    path: 'status-pages',
    providers: [StatusPagesStore],
    loadChildren: () => import('./status-pages/status-pages.routes').then((r) => r.ROUTES),
  },
  {
    path: 'm',
    loadComponent: () => import('./monitor/monitors.page').then((c) => c.MonitorsPage),
    loadChildren: () => import('./monitor/team-monitor.routes').then((r) => r.ROUTES),
  },
  {
    path: '**',
    redirectTo: 'm',
  },
];
