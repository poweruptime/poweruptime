import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';

import {BackendType} from '@app/api';
import {UptimeTimeline} from '@app/components/monitor';
import {MonitorStatusTextBackground} from '@app/directives';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @for (monitor of monitors(); track monitor.id) {
        <div class="flex flex-col justify-between gap-y-2 lg:flex-row lg:items-center">
          <div class="inline-flex items-center gap-4">
            <strong
              class="max-w-24 truncate rounded-lg px-2 py-1"
              [matTooltip]="
                monitor.status === 'UP'
                  ? ('monitor.oneDayUptime' | transloco)
                  : ('general.status' | transloco)
              "
              [monitor-status-text-background]="monitor.status">
              @if (monitor.status === 'UP') {
                {{ monitor.oneDayUptime }}
              } @else {
                {{ monitor.status }}
              }
            </strong>
            <a
              class="inline-flex items-center gap-2 text-xl"
              [routerLink]="'/public/m/' + monitor.id">
              {{ monitor.name }}
              <ng-icon size="16" name="bootstrapBoxArrowUpRight" />
            </a>
          </div>
          <div class="tl-container">
            <pu-uptime-timeline [checkResults]="monitor.lastCheckResults" [size]="2" />
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    @media (min-width: 1024px) {
      pu-uptime-timeline {
        min-width: 32rem;
      }

      .tl-container {
        min-width: 32rem;
      }
    }
  `,
  selector: 'pu-status-page-monitor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    RouterLink,
    MatTooltip,
    TranslocoPipe,
    UptimeTimeline,
    MonitorStatusTextBackground,
  ],
})
export class StatusPageMonitorList {
  readonly monitors = input.required<BackendType['PublicMonitorMinResponse'][]>();
}
