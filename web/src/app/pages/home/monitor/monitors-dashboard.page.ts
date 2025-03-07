import {Component, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';

import {CheckResultList, NotificationList} from '@app/components/monitor';
import {MonitorsDashboardStore, SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @let selectedTeam = teamId() ? selectedTeamStore.selectedTeam() : undefined;
      <h1 class="text-3xl">
        {{ selectedTeam?.name ?? ('general.personal' | transloco) }} Dashboard
      </h1>

      @let dashboard = monitorsDashboardStore.dashboard();
      @if (dashboard; as dashboard) {
        <div
          class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div class="card">
            <span class="text-2xl">{{ dashboard.monitorCount }}</span>
            <span class="text-lg">Monitor(s)</span>
          </div>
          <a
            class="card"
            [queryParams]="{status: 'UP', showFilter: true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-2xl">{{ dashboard.upCount }}</span>
            <span class="text-lg">Up</span>
          </a>
          <a
            class="card"
            [queryParams]="{status: 'DOWN', showFilter: true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-2xl">{{ dashboard.downCount }}</span>
            <span class="text-lg">Down</span>
          </a>
          <a
            class="card"
            [queryParams]="{status: 'MAINTENANCE', showFilter: true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-2xl">{{ dashboard.maintenanceCount }}</span>
            <span class="text-lg">Maintenance</span>
          </a>
          <a
            class="card"
            [queryParams]="{status: 'PAUSED', showFilter: true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-2xl">{{ dashboard.pausedCount }}</span>
            <span class="text-lg">Paused</span>
          </a>
        </div>
      }

      <pu-notification-list [teamId]="teamId()" />

      <pu-check-result-list [teamId]="teamId()" />
    </div>
  `,
  selector: 'pu-monitors-dashboard',
  styles: `
    .card {
      @apply flex flex-col items-center justify-center rounded-md bg-gray-200 p-4 transition duration-200 hover:bg-gray-300 dark:bg-gray-800 hover:dark:bg-gray-700;
    }
  `,
  imports: [CheckResultList, NotificationList, RouterLink, TranslocoPipe],
})
export class MonitorsDashboardPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);

  readonly teamId = input<string | undefined>(undefined);
}
