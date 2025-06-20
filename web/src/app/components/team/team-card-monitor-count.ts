import {Component, input} from '@angular/core';

import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType} from '@app/api';

@Component({
  template: `
    @let dashboard = team().dashboard;

    <div class="flex justify-between gap-4">
      <div>{{ 'team.monitors' | transloco: dashboard }}</div>
      <div>
        <span
          class="text-green-500"
          [matTooltip]="'team.counts.up' | transloco"
          matTooltipPosition="above">
          {{ dashboard.upCount }}
        </span>
        /
        <span
          class="text-red-500"
          [matTooltip]="'team.counts.down' | transloco"
          matTooltipPosition="above">
          {{ dashboard.downCount }}
        </span>
        /
        <span
          class="text-blue-500"
          [matTooltip]="'team.counts.maintenance' | transloco"
          matTooltipPosition="above">
          {{ dashboard.maintenanceCount }}
        </span>
        /
        <span
          class="text-blue-500"
          [matTooltip]="'team.counts.paused' | transloco"
          matTooltipPosition="above">
          {{ dashboard.pausedCount }}
        </span>
      </div>
    </div>
  `,
  selector: 'pu-team-card-monitor-count',
  imports: [MatTooltip, TranslocoPipe],
})
export class TeamCardMonitorCount {
  readonly team = input.required<BackendType['TeamResponse']>();
}
