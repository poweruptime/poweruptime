import {Routes} from '@angular/router';

export const ROUTES: Routes = [
  {
    path: 'new',
    loadComponent: () => import('./status-page-edit.page').then((c) => c.StatusPageEditPage),
  },
  {
    path: ':statusPageId',
    loadComponent: () => import('./status-page-edit.page').then((c) => c.StatusPageEditPage),
  },
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./status-pages.page').then((c) => c.StatusPagesPage),
  },
];
