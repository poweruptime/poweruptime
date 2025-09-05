import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';

import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatChip} from '@angular/material/chips';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {TranslocoPipe} from '@jsverse/transloco';
import {format} from '@std/fmt/duration';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxCutPipe} from 'dfx-helper';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';

import {Heatmap, Placeholder} from '@app/components';
import {
  InfiniteUptimeTimeline,
  MonitorHeaderPlaceholder,
  MonitorStatus,
  NotificationCheckResultCard,
  PingChart,
  PingChartFilter,
} from '@app/components/monitor';
import {IsTeamAdmin, Tag} from '@app/directives';
import {MonitorCheckerDataValueLabelPipe} from '@app/pipes';
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
        <div class="flex flex-wrap items-center justify-between gap-x-16 gap-y-2">
          <div class="flex items-center gap-6">
            <h1 class="text-4xl font-bold">{{ monitor.name }}</h1>

            <pu-monitor-status [status]="monitor.status" />
          </div>

          <div class="flex items-center gap-3" *isTeamAdmin>
            @if (monitor.status === 'PAUSED') {
              <button
                class="secondary-button"
                (click)="monitorActionStore.start(monitor.id)"
                type="button"
                mat-flat-button>
                <bi name="play-btn" />
                {{ 'general.start' | transloco }}
              </button>
            } @else {
              <button
                class="secondary-button"
                (click)="monitorActionStore.pause(monitor.id)"
                type="button"
                mat-flat-button>
                <bi name="pause-btn" />
                {{ 'general.pause' | transloco }}
              </button>
            }
            <a
              [routerLink]="'/t/' + monitor.team.id + '/m/' + monitor.id + '/edit'"
              queryParamsHandling="merge"
              mat-flat-button>
              <bi name="pencil-square" />
              {{ 'general.edit' | transloco }}
            </a>
            <button [matMenuTriggerFor]="menu" type="button" mat-icon-button>
              <span class="hidden">{{ 'general.menu' | transloco }}</span>
              <bi name="three-dots-vertical" />
            </button>
            <mat-menu #menu="matMenu">
              <a href="/public/m/{{ monitor.id }}" target="_blank" type="button" mat-menu-item>
                <bi name="box-arrow-up-right" />
                {{ 'monitor.details.openPublic' | transloco }}
              </a>
              <button
                (click)="monitorActionStore.clone({id: monitor.id})"
                type="button"
                mat-menu-item>
                <bi name="copy" />
                {{ 'general.copy' | transloco }}
              </button>
              <button (click)="monitorActionStore.delete(monitor.id)" type="button" mat-menu-item>
                <bi name="trash" />
                {{ 'general.delete' | transloco }}
              </button>
            </mat-menu>
          </div>
        </div>

        @if (monitor.description; as description) {
          @let _cutDescription = cutDescription();

          <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
          <pre
            class="whitespace-pre-wrap"
            (keydown)="cutDescription.set(!_cutDescription)"
            (click)="
              cutDescription.set(!_cutDescription)
            ">@if (cutDescription()) {{{ description | s_cut: 300 : '....' }} } @else {{{ description }}}</pre>
        }

        <div class="flex flex-wrap gap-4">
          @switch (monitor.data._type) {
            @case ('HTTP') {
              <a
                class="font-extrabold text-emerald-700 dark:text-green-500"
                [href]="$any(monitor.data)['url']"
                target="_blank"
                rel="noopener noreferrer">
                {{ $any(monitor.data)['url'] }}
              </a>
            }
            @case ('SSL_CERTIFICATE') {
              <a
                class="font-extrabold text-emerald-700 dark:text-green-500"
                [href]="$any(monitor.data)['url']"
                target="_blank"
                rel="noopener noreferrer">
                {{ $any(monitor.data)['url'] }}
              </a>
            }
            @case ('DNS') {
              <span class="font-extrabold text-emerald-700 dark:text-green-500">
                [{{ $any(monitor.data)['type'] }}]
                {{ $any(monitor.data)['host'] }}
              </span>
            }
            @case ('PING') {
              <span class="font-extrabold text-emerald-700 dark:text-green-500">
                {{ $any(monitor.data)['ip'] }}:{{ $any(monitor.data)['port'] }}
              </span>
            }
          }
        </div>

        <div class="flex flex-wrap gap-3">
          <a
            class="hover:cursor-pointer"
            [routerLink]="[]"
            [queryParams]="{'search.show': true, 'search.type': monitor.data._type}"
            queryParamsHandling="merge">
            <mat-chip>
              {{ monitor.data._type | monitorCheckerDataValueLabel | transloco }}
              {{ 'general.monitor' | transloco }}
            </mat-chip>
          </a>

          @if (monitor.retries; as retries) {
            <mat-chip class="flex items-center">
              <bi class="mr-1" name="arrow-repeat" />
              <span>{{ 'monitor.details.retries' | transloco: {retries} }}</span>
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

          @let maxNotificationMethods = 6;
          @for (
            notificationMethod of monitor.notificationMethods.slice(0, maxNotificationMethods);
            track notificationMethod.id
          ) {
            <a
              class="hover:cursor-pointer"
              [routerLink]="
                '/t/' + monitor.team.id + '/notification-methods/' + notificationMethod.id
              ">
              <mat-chip class="flex items-center">
                <bi class="mr-1" name="bell" />
                {{ notificationMethod.name }}
              </mat-chip>
            </a>
          }
          @if (monitor.notificationMethods.length > maxNotificationMethods) {
            <mat-chip class="flex items-center">
              <bi class="mr-1" name="bell" />
              And more...
            </mat-chip>
          }
        </div>

        @if (monitor.tags.length > 0) {
          <div class="flex flex-wrap gap-2">
            @for (tag of monitor.tags; track tag.name) {
              <span
                class="text-xs whitespace-nowrap"
                [pu-tag]="tag.variant"
                [routerLink]="[]"
                [queryParams]="{'search.show': true, 'search.tag': tag.name}"
                clickable
                queryParamsHandling="merge">
                {{ tag.name }}
              </span>
            }
          </div>
        }
      } @else {
        <pu-monitor-header-placeholder />
      }

      <hr class="my-2" />

      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="flex flex-col gap-2">
            <pu-infinite-uptime-timeline
              [isPending]="infiniteCheckResultsStore.isInfinitePending()"
              [checkResults]="infiniteCheckResultsStore.entities()"
              (nextPage)="infiniteCheckResultsStore.nextPage(monitorId())"
              link />

            @if (testIntervalDuration(); as testIntervalDuration) {
              <span>
                {{ 'monitor.details.check' | transloco: {testIntervalDuration} }}
              </span>
            } @else {
              <pu-placeholder class="h-6 w-40" />
            }
          </div>
        </mat-card-content>
      </mat-card>

      @if (monitorDetailStore.isFulfilled()) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <div
              class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-8">
              @for (uptimeResult of monitorDetailStore.uptimeResults(); track uptimeResult.name) {
                <div
                  class="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 transition duration-200 hover:bg-gray-200 dark:border-gray-700 dark:hover:bg-gray-900">
                  <span class="text-center text-lg font-semibold">{{ uptimeResult.value }}</span>
                  <span class="text-center text-gray-600 dark:text-gray-300">
                    {{ uptimeResult.name }}
                  </span>
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

      <mat-card appearance="outlined">
        <mat-card-content>
          <pu-ping-chart-filter
            [filter]="pingChartFilter()"
            (filterChange)="
              rangeStartPingChartFilter.set($event.range.start);
              rangeEndPingChartFilter.set($event.range.end);
              precisionPingChartFilter.set($event.precision)
            " />

          @defer (on idle) {
            @if (checkResultsPingStore.isFulfilled()) {
              <pu-ping-chart [chart]="checkResultsPingStore.data()!" />
            } @else {
              <pu-placeholder class="w-full" style="height: 24rem" />
            }
          } @placeholder {
            <pu-placeholder class="w-full" style="height: 24rem" />
          }
        </mat-card-content>
      </mat-card>

      @if (monitorId(); as monitorId) {
        <pu-notification-check-result-card [monitorId]="monitorId" />
      }
    </div>
  `,
  selector: 'monitor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorActionStore, InfiniteCheckResultsStore, CheckResultsPingStore],
  imports: [
    MatCard,
    MatCardContent,
    MatChip,
    BiComponent,
    MonitorStatus,
    InfiniteUptimeTimeline,
    PingChart,
    Heatmap,
    MonitorHeaderPlaceholder,
    MatButton,
    RouterLink,
    DfxCutPipe,
    Placeholder,
    TranslocoPipe,
    PingChartFilter,
    MonitorCheckerDataValueLabelPipe,
    IsTeamAdmin,
    Tag,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatIconButton,
    NotificationCheckResultCard,
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
    parse: (it) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return it ?? toBackendDate(yesterday);
    },
    stringify: (value) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return value === toBackendDate(yesterday) ? null : value;
    },
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
      return undefined;
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
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const hasSelectedYesterday = filter.range.start === toBackendDate(yesterday);
        const hasSelectedToday = filter.range.end === toBackendDate(now);
        return {
          monitorId: this.monitorId(),
          precision: this.precisionPingChartFilter(),
          start: dateToDateTime(
            filter.range.start,
            hasSelectedYesterday ? yesterday.getHours() : 0,
            hasSelectedYesterday ? yesterday.getMinutes() : 0,
            hasSelectedYesterday ? yesterday.getHours() : 0,
            0,
          ),
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
