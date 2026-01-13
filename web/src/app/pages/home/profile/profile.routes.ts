import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile.page').then((c) => c.ProfilePage),
  },
  {
    path: '**',
    redirectTo: '/profile',
  },
];
