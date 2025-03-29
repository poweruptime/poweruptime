import {Routes} from '@angular/router';

import {isDesktopGuard} from '@app/guards/is-desktop.guard';
import {isMobileGuard} from '@app/guards/is-mobile.guard';
import {
  MonitorsDashboardStore,
  MonitorsStore,
  NotificationMethodsStore,
  StatusPagesStore,
} from '@app/services';

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
    path: 'recycle-bin',
    loadChildren: () => import('./recycle-bin/recycle-bin.route').then((r) => r.ROUTES),
  },
  {
    path: 'm',
    canActivate: [isDesktopGuard],
    loadComponent: () => import('./monitor/monitors.page').then((c) => c.MonitorsPage),
    loadChildren: () => import('./monitor/desktop-team-monitor.routes').then((r) => r.ROUTES),
  },
  {
    path: 'mm',
    canActivate: [isMobileGuard],
    providers: [MonitorsStore, MonitorsDashboardStore],
    loadChildren: () => import('./monitor/mobile-team-monitor.routes').then((r) => r.ROUTES),
  },
  {
    path: '**',
    redirectTo: 'm',
  },
];
