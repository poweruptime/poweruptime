import {Routes} from '@angular/router';

import {isLoggedIn} from '@app/guards/is-logged-in.guard';
import {isSetupGuard} from '@app/guards/is-setup.guard';
import {statusPageGuard} from '@app/guards/status-page.guard';

export const ROUTES: Routes = [
  {
    path: '',
    canActivate: [statusPageGuard],
    pathMatch: 'full',
    loadComponent: () => import('./outside.layout').then((c) => c.OutsideLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./public/public-status-page.page').then((c) => c.PublicStatusPagePage),
      },
    ],
  },
  {
    path: '',
    canActivate: [isLoggedIn],
    loadChildren: () => import('./home/home.routes').then((r) => r.ROUTES),
  },
  {
    path: 'public',
    loadChildren: () => import('./public/public.routes').then((r) => r.ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((r) => r.ROUTES),
  },
  {
    path: 'email-change',
    loadChildren: () => import('./email-change/email-change.routes').then((r) => r.ROUTES),
  },
  {
    path: 'setup',
    canActivate: [isSetupGuard],
    loadComponent: () => import('./auth/auth.layout').then((c) => c.AuthLayout),
    children: [{path: '', loadComponent: () => import('./setup.page').then((c) => c.SetupPage)}],
  },
  {
    path: 'not-found',
    loadComponent: () => import('./not-found.page').then((c) => c.NotFoundPage),
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];
