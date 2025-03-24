import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () =>
      import('./notification-method-edit.page').then((c) => c.NotificationMethodEditPage),
  },
  {
    path: ':notificationMethodId',
    loadComponent: () =>
      import('./notification-method-edit.page').then((c) => c.NotificationMethodEditPage),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./notification-methods.page').then((c) => c.NotificationMethodsPage),
  },
];
