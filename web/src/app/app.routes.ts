import {Routes} from '@angular/router';

import {statusPageGuard} from '@app/guards/status-page.guard';

import {isLoggedIn} from './guards/is-logged-in.guard';

export const ROUTES: Routes = [
  {
    path: '',
    canActivate: [statusPageGuard],
    pathMatch: 'full',
    loadComponent: () => import('./pages/outside.layout').then((c) => c.OutsideLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/public/public-status-page.page').then((c) => c.PublicStatusPagePage),
      },
    ],
  },
  {
    path: '',
    canActivate: [isLoggedIn],
    loadChildren: () => import('./pages/home/home.routes').then((r) => r.ROUTES),
  },
  {
    path: 'public',
    loadChildren: () => import('./pages/public/public.routes').then((r) => r.ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then((r) => r.ROUTES),
  },
  {
    path: 'email-change',
    loadChildren: () => import('./pages/email-change/email-change.routes').then((r) => r.ROUTES),
  },
  {
    path: 'not-found',
    loadComponent: () => import('./pages/not-found.page').then((c) => c.NotFoundPage),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
