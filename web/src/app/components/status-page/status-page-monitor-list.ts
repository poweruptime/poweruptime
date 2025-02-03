import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {BiComponent} from 'dfx-bootstrap-icons';

import {UptimeTimeline} from '@app/components/monitor';
import {MonitorStatusBackground} from '@app/directives';
import {PublicStatusPageMonitorsStore} from '@app/services/status-page/public-status-page-monitors.store';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      @for (monitor of publicStatusPageMonitorsStore.entities(); track monitor.id) {
        <div class="flex items-center justify-between">
          <div class="inline-flex items-center gap-4">
            <strong
              class="max-w-24 truncate rounded-lg px-2 py-1"
              [matTooltip]="monitor.status === 'UP' ? 'One-day uptime' : 'Status'"
              [monitor-status-background]="monitor.status">
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
              <bi size="16" name="box-arrow-up-right" />
            </a>
          </div>
          <pu-uptime-timeline [checkResults]="monitor.lastCheckResults" [size]="2" />
        </div>
      }
    </div>
  `,
  selector: 'pu-status-page-monitor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PublicStatusPageMonitorsStore],
  imports: [UptimeTimeline, BiComponent, RouterLink, MonitorStatusBackground, MatTooltip],
})
export class StatusPageMonitorList {
  readonly slug = input.required<string>();
  readonly statusPageGroupIds = input<string[]>();

  readonly publicStatusPageMonitorsStore = inject(PublicStatusPageMonitorsStore);

  constructor() {
    this.publicStatusPageMonitorsStore.load(
      computed(() => ({
        ...this.publicStatusPageMonitorsStore.pageable(),
        slug: this.slug(),
        usedInStatusPageGroupIds: this.statusPageGroupIds(),
      })),
    );
  }
}
