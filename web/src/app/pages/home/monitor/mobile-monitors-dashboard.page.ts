import {Component, computed, inject, input} from '@angular/core';

import {HlmCardImports} from '@spartan-ng/helm/card';

import {MonitorList} from '@app/components/monitor';
import {MonitorsDashboardPage} from '@app/pages/home/monitor/monitors-dashboard.page';

import {MonitorsDashboardStore, TagsStore} from '../../../services';

@Component({
  template: `
    <pu-monitors-dashboard [teamId]="teamId()">
      <section hlmCard>
        <div hlmCardContent>
          <pu-monitor-list
            [teamId]="teamId()"
            [dashboard]="monitorsDashboardStore.dashboard()"
            [tags]="tagsStore.entities()" />
        </div>
      </section>
    </pu-monitors-dashboard>
  `,
  selector: 'pu-mobile-monitors-dashboard',
  imports: [MonitorsDashboardPage, MonitorList, HlmCardImports],
})
export class MobileMonitorsDashboardPage {
  protected readonly monitorsDashboardStore = inject(MonitorsDashboardStore);
  protected readonly tagsStore = inject(TagsStore);

  readonly teamId = input<string | undefined>(undefined);

  constructor() {
    this.monitorsDashboardStore.loadByTeamId(this.teamId);

    this.tagsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        page: 0,
        size: 200,
      })),
    );
  }
}
