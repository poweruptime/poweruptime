import {Routes} from '@angular/router';

import {ROUTES as TEAM_MONITOR_ROUTES} from './team-monitor.routes';

export const ROUTES: Routes = [
  ...TEAM_MONITOR_ROUTES,
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./mobile-monitors-dashboard.page').then((c) => c.MobileMonitorsDashboardPage),
  },
];
