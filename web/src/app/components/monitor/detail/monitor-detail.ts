import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {format} from '@std/fmt/duration';
import {DfxCutPipe} from 'dfx-helper';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';

import {ChartPlaceholder, Heatmap} from '@app/components';
import {
  InfiniteUptimeTimeline,
  MonitorHeaderPlaceholder,
  MonitorStatus,
  PingChart,
  PingChartFilter,
} from '@app/components/monitor';
import {Tag} from '@app/directives';
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
    <div class="flex flex-col gap-8">
      @if (monitorDetailStore.monitor(); as monitor) {
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-6">
            <h1 class="text-4xl font-bold">{{ monitor.name }}</h1>

            <pu-monitor-status [status]="monitor.status" />
          </div>

          @if (monitor.description; as description) {
            @let _cutDescription = cutDescription();

            <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
            <pre
              class="whitespace-pre-wrap"
              (keydown)="cutDescription.set(!_cutDescription)"
              (click)="cutDescription.set(!_cutDescription)">@if (cutDescription()) {
            {{ description | s_cut: 300 : '....' }}
          } @else {
            {{ description }}
          }</pre>
          }

          <div class="flex flex-wrap gap-4">
            @switch (monitor.type) {
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
              [routerLink]="[]"
              [queryParams]="{'search.show': true, 'search.type': monitor.data._type}"
              hlmBadge
              variant="outline"
              queryParamsHandling="merge">
              {{ monitor.data._type | monitorCheckerDataValueLabel | transloco }}
              {{ 'general.monitor' | transloco }}
            </a>

            @if (monitor.retries; as retries) {
              <div class="flex items-center gap-2" hlmBadge variant="outline">
                <ng-icon class="text-primary" hlm name="bootstrapArrowRepeat" size="xs" />
                <span>{{ 'monitor.details.retries' | transloco: {retries} }}</span>
              </div>
            }

            @if (monitor.resendAfter; as resendAfter) {
              <span hlmBadge variant="outline">
                {{ 'monitor.details.resendAfter' | transloco: {resendAfter} }}
              </span>
            }

            @if (monitor.upsideDown) {
              <div class="flex items-center gap-2" hlmBadge variant="outline">
                <ng-icon class="text-primary" hlm name="bootstrapEmojiSmileUpsideDown" size="xs" />
                {{ 'monitor.edit.upsideDown' | transloco }}
              </div>
            }

            @let maxNotificationMethods = 6;
            @for (
              notificationMethod of monitor.notificationMethods.slice(0, maxNotificationMethods);
              track notificationMethod.id
            ) {
              <a
                class="flex gap-1"
                [routerLink]="
                  '/t/' + monitor.team.id + '/notification-methods/' + notificationMethod.id
                "
                hlmBadge
                variant="outline">
                <ng-icon class="text-primary" hlm name="bootstrapBell" size="xs" />
                {{ notificationMethod.name }}
              </a>
            }
            @if (monitor.notificationMethods.length > maxNotificationMethods) {
              <div class="flex items-center gap-2" hlmBadge variant="outline">
                <ng-icon class="text-primary" hlm name="bootstrapBell" size="xs" />
                And more...
              </div>
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
        </div>
      } @else {
        <pu-monitor-header-placeholder />
      }

      <section class="gap-2" hlmCard>
        <div hlmCardHeader>
          <h3 class="text-lg" hlmCardTitle>{{ 'monitor.details.latestChecks' | transloco }}</h3>

          <div hlmCardAction>
            @if (testIntervalDuration(); as testIntervalDuration) {
              <span class="text-muted-foreground">
                {{ 'monitor.details.check' | transloco: {testIntervalDuration} }}
              </span>
            } @else {
              <hlm-skeleton class="h-6 w-40" />
            }
          </div>
        </div>
        <div hlmCardContent>
          <pu-infinite-uptime-timeline
            [isPending]="infiniteCheckResultsStore.isInfinitePending()"
            [checkResults]="infiniteCheckResultsStore.entities()"
            (nextPage)="infiniteCheckResultsStore.nextPage(monitorId())"
            link />
        </div>
      </section>

      @if (monitorDetailStore.isFulfilled()) {
        <div
          class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-8">
          @for (uptimeResult of monitorDetailStore.uptimeResults(); track uptimeResult.name) {
            <section hlmCard>
              <div hlmCardContent>
                <div class="space-y-2">
                  <p class="text-3xl font-semibold tracking-tight">{{ uptimeResult.value }}</p>
                  <p class="text-muted-foreground text-sm">{{ uptimeResult.name }}</p>
                </div>
              </div>
            </section>
          }
        </div>
      } @else {
        <hlm-skeleton class="h-52 w-full" />
      }

      @defer (on idle) {
        @if (monitorDetailYearlyUptimeStore.isPending()) {
          <hlm-skeleton class="h-60 w-full" />
        } @else {
          <section hlmCard>
            <div hlmCardContent>
              <pu-heatmap [entries]="monitorDetailYearlyUptimeStore.entities()" />
            </div>
          </section>
        }
      } @placeholder {
        <hlm-skeleton class="h-60 w-full" />
      }

      <section hlmCard>
        <div hlmCardContent>
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
              <pu-chart-placeholder class="w-full" style="height: 24rem" />
            }
          } @placeholder {
            <pu-chart-placeholder class="w-full" style="height: 24rem" />
          }
        </div>
      </section>
    </div>
  `,
  selector: 'pu-monitor-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InfiniteCheckResultsStore, CheckResultsPingStore],
  imports: [
    MonitorStatus,
    InfiniteUptimeTimeline,
    PingChart,
    Heatmap,
    MonitorHeaderPlaceholder,
    RouterLink,
    DfxCutPipe,
    HlmSkeletonImports,
    TranslocoPipe,
    PingChartFilter,
    MonitorCheckerDataValueLabelPipe,
    Tag,
    ChartPlaceholder,
    HlmIconImports,
    HlmCardImports,
    HlmBadgeImports,
  ],
})
export class MonitorDetail {
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
