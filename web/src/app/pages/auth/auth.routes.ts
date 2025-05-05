import {Routes} from '@angular/router';

import {isNotLoggedIn} from '@app/guards/is-not-logged-in.guard';
import {isNotSetupGuard} from '@app/guards/is-not-setup.guard';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./auth.layout').then((c) => c.AuthLayout),
    canActivate: [isNotLoggedIn],
    canActivateChild: [isNotLoggedIn],
    children: [
      {
        path: 'login',
        canActivate: [isNotSetupGuard],
        loadComponent: () => import('./login.page').then((c) => c.LoginPage),
      },
      {
        path: 'password-change',
        canActivate: [isNotSetupGuard],
        loadComponent: () =>
          import('./password-change-login-page.component').then((c) => c.PasswordChangeLoginPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password.page').then((c) => c.ForgotPasswordPage),
      },
    ],
  },
];
