import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';

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
              [monitor-status-text-background]="monitor.status"
              [hlmTooltip]="tooltip">
              @if (monitor.status === 'UP') {
                {{ monitor.oneDayUptime }}
              } @else {
                {{ monitor.status }}
              }
            </strong>
            <ng-template #tooltip>
              <span>
                @if (monitor.status === 'UP') {
                  {{ 'monitor.oneDayUptime' | transloco }}
                } @else {
                  {{ 'general.status' | transloco }}
                }
              </span>
            </ng-template>

            <a
              class="inline-flex items-center gap-2 text-xl"
              [routerLink]="'/public/m/' + monitor.id"
              size="lg"
              variant="ghost"
              hlmBtn>
              {{ monitor.name }}
              <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
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
    RouterLink,
    TranslocoPipe,
    UptimeTimeline,
    MonitorStatusTextBackground,
    HlmTooltipImports,
    HlmButtonImports,
    HlmIconImports,
  ],
})
export class StatusPageMonitorList {
  readonly monitors = input.required<BackendType['PublicMonitorMinResponse'][]>();
}
