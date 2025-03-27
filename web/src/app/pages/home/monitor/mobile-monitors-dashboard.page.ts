import {Component, input} from '@angular/core';

import {MonitorList} from '@app/components/monitor';
import {MonitorsDashboardPage} from '@app/pages/home/monitor/monitors-dashboard.page';

@Component({
  template: `
    <pu-monitors-dashboard [teamId]="teamId()">
      <pu-monitor-list [teamId]="teamId()" />
    </pu-monitors-dashboard>
  `,
  selector: 'pu-mobile-monitors-dashboard',
  imports: [MonitorsDashboardPage, MonitorList],
})
export class MobileMonitorsDashboardPage {
  readonly teamId = input<string | undefined>(undefined);
}
