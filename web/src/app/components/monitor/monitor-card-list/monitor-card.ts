import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {RouterLink, RouterLinkActive} from '@angular/router';

import type {BackendType} from '@app/api';
import {MonitorStatusBackground} from '@app/directives';

import {UptimeTimeline} from '../uptime-timeline';

@Component({
  template: `
    @let _monitor = monitor();
    <a [routerLink]="_monitor.id" [queryParamsHandling]="'merge'" style="height: 140px">
      <mat-card routerLinkActive="active-card" appearance="outlined" style="height: 140px">
        <mat-card-content>
          <div class="flex flex-col items-start justify-between rounded-lg" style="height: 120px">
            <div class="flex items-center gap-2">
              <strong
                class="max-w-24 truncate rounded-lg px-2 py-1"
                [monitor-status-background]="_monitor.status">
                @if (_monitor.status === 'UP') {
                  {{ _monitor.oneDayUptime }}
                } @else {
                  {{ _monitor.status }}
                }
              </strong>
              <span class="max-w-72 truncate">{{ _monitor.name }}</span>
            </div>
            <pu-uptime-timeline
              class="min-w-full"
              [checkResults]="_monitor.lastCheckResults"
              [size]="2" />
          </div>
        </mat-card-content>
      </mat-card>
    </a>
  `,
  selector: 'pu-monitor-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    MonitorStatusBackground,
    UptimeTimeline,
    MatCard,
    MatCardContent,
  ],
})
export class MonitorCard {
  monitor = input.required<BackendType['MonitorResponse']>();
}
