import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';

import {NotificationCheckResultCard} from '@app/components/monitor';
import {MonitorsDashboardStore, SelectedTeamStore} from '@app/services';

@Component({
  selector: 'pu-metric-card',
  template: `
    <section class="h-full py-3" hlmCard>
      <div class="flex items-start justify-between px-4" hlmCardContent>
        <div class="flex-1">
          <div class="text-muted-foreground mb-2 flex items-center gap-2 text-sm">
            <ng-content select="[title]" />
          </div>
          <div class="text-foreground mb-1 text-3xl font-semibold">
            <ng-content select="[value]" />
          </div>
          <div class="text-muted-foreground text-xs">
            <ng-content select="[subtitle]" />
          </div>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCardImports],
})
export class MetricCard {}

@Component({
  template: `
    <div class="flex flex-col gap-10">
      @let selectedTeam = teamId() ? selectedTeamStore.selectedTeam() : undefined;
      <h1 class="text-3xl">
        {{ selectedTeam?.name ?? ('general.personal' | transloco) }} Dashboard
      </h1>

      @let dashboard = monitorsDashboardStore.dashboard();
      @if (dashboard; as dashboard) {
        <div
          class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <pu-metric-card>
            <span title>Active Monitors</span>
            <span value>
              {{ dashboard.monitorCount - dashboard.pausedCount - dashboard.maintenanceCount }}
            </span>
            <span subtitle>{{ dashboard.pausedCount }} paused</span>
          </pu-metric-card>

          <pu-metric-card
            [queryParams]="{'search.status': 'DOWN', 'search.show': true}"
            routerLink="."
            queryParamsHandling="replace">
            <span title>Incidents</span>
            <span value>{{ dashboard.downCount }}</span>
            <span subtitle>down monitors</span>
          </pu-metric-card>
        </div>
      }

      <ng-content />

      <pu-notification-check-result-card [teamId]="teamId()" />
    </div>
  `,
  selector: 'pu-monitors-dashboard',
  imports: [RouterLink, TranslocoPipe, NotificationCheckResultCard, MetricCard],
})
export class MonitorsDashboardPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);

  readonly teamId = input<string | undefined>(undefined);
}
