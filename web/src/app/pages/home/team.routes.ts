import {Routes} from '@angular/router';

import {teamSelectedGuard} from '@app/guards/team-selected.guard';

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
    loadChildren: () => import('./selected-team.routes').then((r) => r.ROUTES),
  },
];
