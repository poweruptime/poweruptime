import {Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {BackendType} from '@app/api';

@Component({
  template: `
    @let dashboard = team().dashboard;

    <div class="flex justify-between gap-4">
      <div>{{ 'team.monitors' | transloco: dashboard }}</div>
      <div>
        <span class="text-green-500" [hlmTooltip]="'team.counts.up' | transloco">
          {{ dashboard.upCount }}
        </span>
        /
        <span class="text-red-500" [hlmTooltip]="'team.counts.down' | transloco">
          {{ dashboard.downCount }}
        </span>
        /
        <span class="text-blue-500" [hlmTooltip]="'team.counts.maintenance' | transloco">
          {{ dashboard.maintenanceCount }}
        </span>
        /
        <span class="text-blue-500" [hlmTooltip]="'team.counts.paused' | transloco">
          {{ dashboard.pausedCount }}
        </span>
      </div>
    </div>
  `,
  selector: 'pu-team-card-monitor-count',
  imports: [TranslocoPipe, HlmTooltipImports],
})
export class TeamCardMonitorCount {
  readonly team = input.required<BackendType['TeamResponse']>();
}
