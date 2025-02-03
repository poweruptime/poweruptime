import {Routes} from '@angular/router';

import {teamSelectedGuard} from '@app/guards/team-selected.guard';
import {NotificationMethodsStore, StatusPagesStore} from '@app/services';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./home.layout').then((c) => c.HomeLayout),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./team/teams.page').then((c) => c.TeamsPage),
      },
      {
        path: 'new',
        loadComponent: () => import('./team/team-edit.page').then((c) => c.TeamEditPage),
      },
      {
        path: 'join/:token',
        loadComponent: () => import('./team-join.page').then((c) => c.TeamJoinPage),
      },
    ],
  },
  {
    path: ':teamId',
    canActivate: [teamSelectedGuard],
    loadComponent: () => import('./home.layout').then((c) => c.HomeLayout),
    children: [
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
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./notification-methods/notification-methods.page').then(
                (c) => c.NotificationMethodsPage,
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./notification-methods/notification-method-edit.page').then(
                (c) => c.NotificationMethodEditPage,
              ),
          },
          {
            path: ':notificationMethodId',
            loadComponent: () =>
              import('./notification-methods/notification-method-edit.page').then(
                (c) => c.NotificationMethodEditPage,
              ),
          },
        ],
      },
      {
        path: 'status-pages',
        providers: [StatusPagesStore],
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./status-pages/status-pages.page').then((c) => c.StatusPagesPage),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./status-pages/status-page-edit.page').then((c) => c.StatusPageEditPage),
          },
          {
            path: ':statusPageId',
            loadComponent: () =>
              import('./status-pages/status-page-edit.page').then((c) => c.StatusPageEditPage),
          },
        ],
      },
      {
        path: 'm',
        loadComponent: () => import('./monitor/monitors.page').then((c) => c.MonitorsPage),
        children: [
          {
            path: 'new',
            loadComponent: () =>
              import('./monitor/monitor-edit.page').then((c) => c.MonitorEditPage),
          },
          {
            path: ':monitorId/edit',
            loadComponent: () =>
              import('./monitor/monitor-edit.page').then((c) => c.MonitorEditPage),
          },
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
        path: '**',
        redirectTo: 'm',
      },
    ],
  },
];
