import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./profile.layout').then((c) => c.ProfileLayout),
  },
  {
    path: '**',
    redirectTo: '/profile',
  },
];
