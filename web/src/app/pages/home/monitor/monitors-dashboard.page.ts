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
            <span class="text-4xl font-bold">{{ dashboard.monitorCount }}</span>
            <span class="text-gray-700 dark:text-gray-200">Monitor(s)</span>
          </div>
          <a
            class="card"
            [queryParams]="{'search.status': 'UP', 'search.show': true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-4xl font-bold">{{ dashboard.upCount }}</span>
            <span class="text-gray-700 dark:text-gray-200">
              {{ 'monitor.status.up' | transloco }}
            </span>
          </a>
          <a
            class="card"
            [queryParams]="{'search.status': 'DOWN', 'search.show': true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-4xl font-bold">{{ dashboard.downCount }}</span>
            <span class="text-gray-700 dark:text-gray-200">
              {{ 'monitor.status.down' | transloco }}
            </span>
          </a>
          <a
            class="card"
            [queryParams]="{'search.status': 'MAINTENANCE', 'search.show': true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-4xl font-bold">{{ dashboard.maintenanceCount }}</span>
            <span class="text-gray-700 dark:text-gray-200">
              {{ 'general.maintenance' | transloco }}
            </span>
          </a>
          <a
            class="card"
            [queryParams]="{'search.status': 'PAUSED', 'search.show': true}"
            routerLink="."
            queryParamsHandling="replace">
            <span class="text-4xl font-bold">{{ dashboard.pausedCount }}</span>
            <span class="text-gray-700 dark:text-gray-200">
              {{ 'monitor.status.paused' | transloco }}
            </span>
          </a>
        </div>
      }

      <ng-content />

      <pu-notification-list [teamId]="teamId()" />

      <pu-check-result-list [teamId]="teamId()" />
    </div>
  `,
  selector: 'pu-monitors-dashboard',
  styles: `
    .card {
      @apply grid items-center justify-center gap-3 rounded-md border border-solid p-4 transition duration-200 hover:bg-gray-200 dark:border-gray-500 hover:dark:bg-gray-800;

      span {
        @apply text-center;
      }
    }
  `,
  imports: [CheckResultList, NotificationList, RouterLink, TranslocoPipe],
})
export class MonitorsDashboardPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);

  readonly teamId = input<string | undefined>(undefined);
}
