import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatChip, MatChipSet} from '@angular/material/chips';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {format} from '@std/fmt/duration';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxCutPipe} from 'dfx-helper';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';

import {Heatmap, Placeholder} from '@app/components';
import {
  CheckResultList,
  InfiniteUptimeTimeline,
  MonitorHeaderPlaceholder,
  MonitorStatus,
  NotificationList,
  PingChart,
  PingChartFilter,
} from '@app/components/monitor';
import {
  CheckResultsPingStore,
  InfiniteCheckResultsStore,
  MonitorActionStore,
  MonitorDetailStore,
  MonitorDetailsYearlyUptimeStore,
} from '@app/services';
import {dateToDateTime, toBackendDate} from '@app/services/util';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      @if (monitorDetailStore.monitor(); as monitor) {
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-6">
            <h1 class="text-4xl">{{ monitor.name }}</h1>
            <a href="/public/m/{{ monitor.id }}" target="_blank">
              <bi size="28" name="box-arrow-up-right" aria-hidden="true" />
            </a>
          </div>

          <pu-monitor-status [status]="monitor.status" />
        </div>

        @if (monitor.description; as description) {
          @let _cutDescription = cutDescription();

          <pre
            class="whitespace-pre-wrap"
            (click)="
              cutDescription.set(!_cutDescription)
            ">@if (cutDescription()) {{{ description | s_cut: 300 : '....' }} } @else {{{ description }}}</pre>
        }

        @switch (monitor.checker._type) {
          @case ('HTTP') {
            <a
              class="flex gap-2 font-extrabold text-emerald-700 dark:text-green-500"
              [href]="$any(monitor.checker)['url']"
              target="_blank"
              rel="noopener noreferrer">
              {{ $any(monitor.checker)['url'] }}
            </a>
          }
          @case ('SSL_CERTIFICATE') {
            <a
              class="flex gap-2 font-extrabold text-emerald-700 dark:text-green-500"
              [href]="$any(monitor.checker)['url']"
              target="_blank"
              rel="noopener noreferrer">
              {{ $any(monitor.checker)['url'] }}
            </a>
          }
          @case ('DNS') {
            <span class="flex gap-2 font-extrabold text-emerald-700 dark:text-green-500">
              [{{ $any(monitor.checker)['type'] }}]
              {{ $any(monitor.checker)['host'] }}
            </span>
          }
          @case ('PING') {
            <span class="flex gap-2 font-extrabold text-emerald-700 dark:text-green-500">
              {{ $any(monitor.checker)['ip'] }}:{{ $any(monitor.checker)['port'] }}
            </span>
          }
        }

        <div class="flex items-center gap-2">
          @if (monitor.status === 'PAUSED') {
            <button
              class="secondary-button"
              (click)="monitorActionStore.start(monitor.id)"
              mat-flat-button>
              {{ 'general.start' | transloco }}
            </button>
          } @else {
            <button
              class="secondary-button"
              (click)="monitorActionStore.pause(monitor.id)"
              mat-flat-button>
              {{ 'general.pause' | transloco }}
            </button>
          }
          <a
            [routerLink]="'/t/' + monitor.team.id + '/m/' + monitor.id + '/edit'"
            queryParamsHandling="merge"
            mat-flat-button>
            {{ 'general.edit' | transloco }}
          </a>
          <button
            class="error-button"
            (click)="monitorActionStore.delete(monitor.id)"
            mat-flat-button>
            {{ 'general.delete' | transloco }}
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
            {{ 'general.monitor' | transloco }}
          </mat-chip>

          @if (monitor.retries !== 0) {
            <mat-chip class="flex items-center">
              <bi class="mr-1" name="arrow-repeat" />
              <span>{{ 'monitor.details.retries' | transloco: monitor }}</span>
            </mat-chip>
          }

          @if (monitor.resendAfter; as resendAfter) {
            <mat-chip class="flex items-center">
              {{ 'monitor.details.resendAfter' | transloco: {resendAfter} }}
            </mat-chip>
          }

          @if (monitor.upsideDown) {
            <mat-chip class="flex items-center">
              <bi class="mr-1" name="emoji-smile-upside-down" />
              {{ 'monitor.edit.upsideDown' | transloco }}
            </mat-chip>
          }
        </mat-chip-set>
      } @else {
        <pu-monitor-header-placeholder />
      }

      <hr class="my-2" />

      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="flex flex-col gap-2">
            <pu-infinite-uptime-timeline
              [isPending]="infiniteCheckResultsStore.isPending()"
              [checkResults]="infiniteCheckResultsStore.entities()"
              (nextPage)="infiniteCheckResultsStore.nextPage(monitorId())"
              link />

            @if (monitorDetailStore.monitor(); as monitor) {
              <span>
                {{
                  'monitor.details.check'
                    | transloco: {testIntervalDuration: testIntervalDuration()}
                }}
              </span>
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
                  <span class="text-center text-2xl">{{ uptimeResult.value }}</span>
                  <span class="text-center text-lg">{{ uptimeResult.name }}</span>
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
        @if (checkResultsPingStore.isFulfilled()) {
          <mat-card appearance="outlined">
            <mat-card-content>
              <pu-ping-chart-filter
                [filter]="pingChartFilter()"
                (filterChange)="
                  rangeStartPingChartFilter.set($event.range.start);
                  rangeEndPingChartFilter.set($event.range.end);
                  precisionPingChartFilter.set($event.precision)
                " />

              <pu-ping-chart [chart]="checkResultsPingStore.data()!" />
            </mat-card-content>
          </mat-card>
        } @else {
          <pu-placeholder class="w-full" style="height: 28rem" />
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
  providers: [MonitorActionStore, InfiniteCheckResultsStore, CheckResultsPingStore],
  imports: [
    MatCard,
    MatCardContent,
    MatChipSet,
    MatChip,
    BiComponent,
    MonitorStatus,
    InfiniteUptimeTimeline,
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
    TranslocoPipe,
    PingChartFilter,
  ],
})
export class MonitorDetailPage {
  readonly monitorDetailStore = inject(MonitorDetailStore);
  readonly monitorDetailYearlyUptimeStore = inject(MonitorDetailsYearlyUptimeStore);
  readonly monitorActionStore = inject(MonitorActionStore);
  readonly checkResultsPingStore = inject(CheckResultsPingStore);
  readonly infiniteCheckResultsStore = inject(InfiniteCheckResultsStore);

  readonly monitorId = input.required<string>();

  readonly cutDescription = signal(true);

  readonly rangeStartPingChartFilter = linkedQueryParam('ping.filter.range.start', {
    parse: (it) => it ?? toBackendDate(new Date()),
    stringify: (value) => (value === toBackendDate(new Date()) ? null : value),
  });
  readonly rangeEndPingChartFilter = linkedQueryParam('ping.filter.range.end', {
    parse: (it) => it ?? toBackendDate(new Date()),
    stringify: (value) => (value === toBackendDate(new Date()) ? null : value),
  });
  readonly precisionPingChartFilter = linkedQueryParam('ping.filter.precision', {
    parse: paramToNumber({
      defaultValue: 15,
    }),
    stringify: (value) => (value === 15 ? null : value),
  });

  readonly pingChartFilter = computed(() => ({
    range: {
      start: this.rangeStartPingChartFilter(),
      end: this.rangeEndPingChartFilter(),
    },
    precision: this.precisionPingChartFilter(),
  }));

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

    this.infiniteCheckResultsStore.load(
      computed(() => ({
        monitorId: this.monitorId(),
        page: this.infiniteCheckResultsStore.page(),
      })),
    );

    this.checkResultsPingStore.load(
      computed(() => {
        const filter = this.pingChartFilter();
        const now = new Date();
        const hasSelectedToday = filter.range.end === toBackendDate(now);
        return {
          monitorId: this.monitorId(),
          precision: this.precisionPingChartFilter(),
          start: dateToDateTime(filter.range.start, 0, 0, 0, 0),
          end: dateToDateTime(
            filter.range.end,
            hasSelectedToday ? now.getHours() : 0,
            hasSelectedToday ? now.getMinutes() : 0,
            hasSelectedToday ? now.getSeconds() : 0,
            0,
          ),
        };
      }),
    );
  }
}
