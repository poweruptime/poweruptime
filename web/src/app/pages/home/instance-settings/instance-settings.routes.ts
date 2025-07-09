import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./instance-settings.layout').then((c) => c.InstanceSettingsLayout),
    children: [
      {
        path: 'overview',
        loadComponent: () =>
          import('./instance-settings-overview.page').then((c) => c.InstanceSettingsOverviewPage),
      },
      {
        path: 'info',
        loadComponent: () =>
          import('./instance-settings-info.page').then((c) => c.InstanceSettingsInfoPage),
      },
      {
        path: 'users',
        children: [
          {
            path: '',
            pathMatch: 'full',
            loadComponent: () =>
              import('./instance-settings-users.page').then((c) => c.InstanceSettingsUsersPage),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./instance-settings-user-edit.page').then(
                (c) => c.InstanceSettingsUserEditPage,
              ),
          },
          {
            path: ':userId/edit',
            loadComponent: () =>
              import('./instance-settings-user-edit.page').then(
                (c) => c.InstanceSettingsUserEditPage,
              ),
          },
          {
            path: '**',
            redirectTo: '',
          },
        ],
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./instance-settings-teams.page').then((c) => c.InstanceSettingsTeamsPage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'overview',
      },
      {
        path: '**',
        redirectTo: 'overview',
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'm',
  },
];
