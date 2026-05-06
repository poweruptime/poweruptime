import {Routes} from '@angular/router';

import {MaintenanceStore} from './maintenance.store';

export const ROUTES: Routes = [
  {
    path: 'new',
    providers: [MaintenanceStore],
    loadComponent: () => import('./maintenance-edit.page').then((c) => c.MaintenanceEditPage),
  },
  {
    path: ':maintenanceId',
    providers: [MaintenanceStore],
    loadComponent: () => import('./maintenance-edit.page').then((c) => c.MaintenanceEditPage),
  },
  {
    path: '',
    pathMatch: 'full',
    providers: [MaintenanceStore],
    loadComponent: () => import('./maintenance.page').then((c) => c.MaintenancePage),
  },
];
