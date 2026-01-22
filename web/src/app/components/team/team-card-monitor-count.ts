import {Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

import {BackendType} from '@app/api';

@Component({
  template: `
    @let dashboard = team().dashboard;

    <div class="flex justify-between gap-4">
      <div>{{ 'team.monitors' | transloco: dashboard }}</div>
      <div>
        <hlm-tooltip>
          <span class="text-green-500" hlmTooltipTrigger>
            {{ dashboard.upCount }}
          </span>
          <span *brnTooltipContent>{{ 'team.counts.up' | transloco }}</span>
        </hlm-tooltip>
        /
        <hlm-tooltip>
          <span class="text-red-500" hlmTooltipTrigger>
            {{ dashboard.downCount }}
            <span *brnTooltipContent>{{ 'team.counts.down' | transloco }}</span>
          </span>
        </hlm-tooltip>
        /
        <hlm-tooltip>
          <span class="text-blue-500" hlmTooltipTrigger>
            {{ dashboard.maintenanceCount }}
          </span>
          <span *brnTooltipContent>{{ 'team.counts.maintenance' | transloco }}</span>
        </hlm-tooltip>
        /
        <hlm-tooltip>
          <span class="text-blue-500" hlmTooltipTrigger>
            {{ dashboard.pausedCount }}
          </span>
          <span *brnTooltipContent>{{ 'team.counts.paused' | transloco }}</span>
        </hlm-tooltip>
      </div>
    </div>
  `,
  selector: 'pu-team-card-monitor-count',
  imports: [TranslocoPipe, HlmTooltipImports, BrnTooltipContentTemplate],
})
export class TeamCardMonitorCount {
  readonly team = input.required<BackendType['TeamResponse']>();
}
