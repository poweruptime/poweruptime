import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {RouterLink} from '@angular/router';

import {format} from '@std/fmt/duration';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxCutPipe} from 'dfx-helper';

import {Heatmap, Placeholder} from '@app/components';
import {
  CheckResultList,
  MonitorHeaderPlaceholder,
  MonitorStatus,
  NotificationList,
  PingChart,
  UptimeTimeline,
} from '@app/components/monitor';
import {
  CheckResultsStore,
  MonitorActionStore,
  MonitorDetailStore,
  MonitorDetailsYearlyUptimeStore,
} from '@app/services';
import {calculatePingChart} from '@app/services/util';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (monitorDetailStore.monitor(); as monitor) {
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h1 class="text-4xl">{{ monitor.name }}</h1>
            <a href="/public/m/{{ monitor.id }}" target="_blank">
              <bi size="28" name="box-arrow-up-right" />
            </a>
          </div>

          <pu-monitor-status [status]="monitor.status" />
        </div>

        @if (monitor.description; as description) {
          @let _cutDescription = cutDescription();

          <span (click)="cutDescription.set(!_cutDescription)">
            @if (cutDescription()) {
              {{ description | s_cut: 600 : '....' }}
            } @else {
              {{ description }}
            }
          </span>
        }

        @switch (monitor.checker._type) {
          @case ('HTTP') {
            <a
              class="flex gap-2 font-extrabold text-green-500"
              [href]="$any(monitor.checker)['url']"
              target="_blank"
              rel="noopener noreferrer">
              {{ $any(monitor.checker)['url'] }}
            </a>
          }
          @case ('SSL_CERTIFICATE') {
            <a
              class="flex gap-2 font-extrabold text-green-500"
              [href]="$any(monitor.checker)['url']"
              target="_blank"
              rel="noopener noreferrer">
              {{ $any(monitor.checker)['url'] }}
            </a>
          }
          @case ('DNS') {
            <span class="flex gap-2 font-extrabold text-green-500">
              [{{ $any(monitor.checker)['type'] }}]
              {{ $any(monitor.checker)['host'] }}
            </span>
          }
          @case ('PING') {
            <span class="flex gap-2 font-extrabold text-green-500">
              {{ $any(monitor.checker)['ip'] }}:{{ $any(monitor.checker)['port'] }}
            </span>
          }
        }

        <div class="flex items-center gap-2">
          @if (monitor.status === 'PAUSED' || monitor.status === 'MAINTENANCE') {
            <button
              class="secondary-button"
              (click)="monitorActionStore.start(monitor.id)"
              mat-flat-button>
              Start
            </button>
          } @else {
            <button
              class="secondary-button"
              (click)="monitorActionStore.pause(monitor.id)"
              mat-flat-button>
              Pause
            </button>
            <button
              class="secondary-button"
              (click)="monitorActionStore.maintenance(monitor.id)"
              mat-flat-button>
              Maintenance
            </button>
          }
          <a
            [routerLink]="'/t/' + monitor.team.id + '/m/' + monitor.id + '/edit'"
            queryParamsHandling="merge"
            mat-flat-button>
            Edit
          </a>
          <button
            class="error-button"
            (click)="monitorActionStore.delete(monitor.id)"
            mat-flat-button>
            Delete
          </button>
        </div>

        <mat-chip-set aria-label="Dog selection">
          <mat-chip>
            @switch (monitor.checker._type) {
              @case ('HTTP') {
                HTTP
              }
              @case ('SSL_CERTIFICATE') {
                SSL
              }
              @case ('DNS') {
                DNS
              }
              @case ('PING') {
                Ping
              }
              @case ('PUSH') {
                Push
              }
              @default {
                Unknown
              }
            }
            Monitor
          </mat-chip>

          @if (monitor.retries !== 0) {
            <mat-chip class="flex items-center">
              <bi class="mr-1" name="arrow-repeat" />
              <span>{{ monitor.retries }}x retries</span>
            </mat-chip>
          }

          @if (monitor.resendAfter; as resendAfter) {
            <mat-chip class="flex items-center">
              Resend notification after {{ resendAfter }}x down checks
            </mat-chip>
          }

          @if (monitor.upsideDown) {
            <mat-chip class="flex items-center">
              <bi class="mr-1" name="emoji-smile-upside-down" />
              Upside down
            </mat-chip>
          }
        </mat-chip-set>
      } @else {
        <pu-monitor-header-placeholder />
      }

      <hr class="my-6" />

      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="flex flex-col gap-2">
            @if (checkResultsStore.isPending()) {
              <pu-placeholder class="h-20 w-full" />
            } @else {
              <pu-uptime-timeline [checkResults]="checkResultsStore.entities()" />
            }

            @if (monitorDetailStore.monitor(); as monitor) {
              <span>Check every {{ testIntervalDuration() }}</span>
            } @else {
              <pu-placeholder class="h-6 w-40" />
            }
          </div>
        </mat-card-content>
      </mat-card>

      @if (monitorDetailStore.monitor(); as monitor) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <div
              class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              @for (uptimeResult of monitorDetailStore.uptimeResults(); track uptimeResult.name) {
                <div
                  class="flex flex-col items-center justify-center rounded-md bg-gray-200 p-4 transition duration-200 hover:bg-gray-300 dark:bg-gray-800 hover:dark:bg-gray-700">
                  <span class="text-2xl">{{ uptimeResult.value }}</span>
                  <span class="text-lg">{{ uptimeResult.name }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      } @else {
        <pu-placeholder class="h-52 w-full" />
      }

      @defer (on idle) {
        @if (monitorDetailYearlyUptimeStore.isPending()) {
          <pu-placeholder class="h-64 w-full" />
        } @else {
          <mat-card appearance="outlined">
            <mat-card-content>
              <pu-heatmap [entries]="monitorDetailYearlyUptimeStore.entities()" />
            </mat-card-content>
          </mat-card>
        }
      } @placeholder {
        <pu-placeholder class="h-64 w-full" />
      }

      @defer (on idle) {
        @if (checkResultsStore.isPending()) {
          <pu-placeholder class="w-full" style="height: 28rem" />
        } @else {
          <mat-card appearance="outlined">
            <mat-card-content class="dark">
              <pu-ping-chart [chart]="pingChart()" />
            </mat-card-content>
          </mat-card>
        }
      } @placeholder {
        <pu-placeholder class="w-full" style="height: 28rem" />
      }

      @if (monitorId(); as monitorId) {
        <pu-check-result-list [monitorId]="monitorId" />

        <pu-notification-list [monitorId]="monitorId" />
      }
    </div>
  `,
  selector: 'monitor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorActionStore, CheckResultsStore],
  imports: [
    MatCard,
    MatCardContent,
    MatChipSet,
    MatChip,
    BiComponent,
    MonitorStatus,
    UptimeTimeline,
    PingChart,
    Heatmap,
    MonitorHeaderPlaceholder,
    CheckResultList,
    NotificationList,
    MatButton,
    RouterLink,
    MatAnchor,
    DfxCutPipe,
    Placeholder,
  ],
})
export class MonitorDetailPage {
  readonly monitorDetailStore = inject(MonitorDetailStore);
  readonly monitorDetailYearlyUptimeStore = inject(MonitorDetailsYearlyUptimeStore);
  readonly monitorActionStore = inject(MonitorActionStore);
  readonly checkResultsStore = inject(CheckResultsStore);

  readonly monitorId = input<string>();

  readonly cutDescription = signal(true);

  readonly pingChart = computed(() => calculatePingChart(this.checkResultsStore.entities()));

  readonly testIntervalDuration = computed(() => {
    const seconds = this.monitorDetailStore.monitor()?.testIntervalSeconds;

    if (!seconds) {
      return '';
    }

    return format(seconds * 1000, {ignoreZero: true, style: 'full'});
  });

  constructor() {
    this.monitorDetailStore.loadMonitorById(this.monitorId);
    this.monitorDetailYearlyUptimeStore.loadByMonitorId(this.monitorId);

    this.checkResultsStore.load(
      computed(() => ({
        teamId: undefined,
        onlyChanges: false,
        page: 0,
        size: 100,
        sort: ['createdAt,desc'],
        monitorId: this.monitorId(),
      })),
    );
  }
}
