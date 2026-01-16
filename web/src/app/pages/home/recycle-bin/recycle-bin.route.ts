import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./recycle-bin.layout').then((c) => c.RecycleBinLayout),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
