import {Routes} from '@angular/router';

import {isNotLoggedIn} from '@app/guards/is-not-logged-in.guard';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth.layout').then((c) => c.AuthLayout),
    canActivate: [isNotLoggedIn],
    canActivateChild: [isNotLoggedIn],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login.page').then((c) => c.LoginPage),
      },
      {
        path: 'password-change',
        loadComponent: () =>
          import('./password-change-login-page.component').then((c) => c.PasswordChangeLoginPage),
      },
    ],
  },
];
