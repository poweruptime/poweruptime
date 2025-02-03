import {Component, input} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';

import {BackendType} from '@app/api';
import {Placeholder} from '@app/components';

@Component({
  template: `
    @if (team(); as team) {
      @let dashboard = team.dashboard;

      <div>{{ dashboard.monitorCount }} Monitor(s)</div>
      <span class="text-green-500" matTooltip="Up monitors" matTooltipPosition="above">
        {{ dashboard.upCount }}
      </span>
      /
      <span class="text-red-500" matTooltip="Down monitors" matTooltipPosition="above">
        {{ dashboard.downCount }}
      </span>
      /
      <span class="text-blue-500" matTooltip="Maintenance monitors" matTooltipPosition="above">
        {{ dashboard.maintenanceCount }}
      </span>
      /
      <span class="text-blue-500" matTooltip="Paused monitors" matTooltipPosition="above">
        {{ dashboard.pausedCount }}
      </span>
    } @else {
      <pu-placeholder class="mb-2 h-5 w-20" />
      <pu-placeholder class="h-5 w-20" />
    }
  `,
  selector: 'pu-team-card-monitor-count',
  imports: [MatTooltip, Placeholder],
})
export class TeamCardMonitorCount {
  readonly team = input.required<BackendType['TeamResponse']>();
}
