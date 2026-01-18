import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {format} from '@std/fmt/duration';
import {DfxCutPipe} from 'dfx-helper';

import {ChartPlaceholder, Heatmap} from '@app/components';
import {
  InfiniteUptimeTimeline,
  MonitorHeaderPlaceholder,
  MonitorStatus,
  PingChartFilter,
} from '@app/components/monitor';
import {MonitorStatusTextBackground, Tag} from '@app/directives';
import {MonitorCheckerDataValueLabelPipe} from '@app/pipes';
import {
  CheckResultsPingStore,
  InfiniteCheckResultsStore,
  MonitorDetailStore,
  MonitorDetailsYearlyUptimeStore,
} from '@app/services';

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
            <span
              class="whitespace-pre-wrap"
              (keydown)="cutDescription.set(!_cutDescription)"
              (click)="cutDescription.set(!_cutDescription)">
              @if (cutDescription()) {
                {{ description | s_cut: 300 : '....' }}
              } @else {
                {{ description }}
              }
            </span>
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
        <div class="grid gap-4">
          <h3 class="text-lg font-bold">Uptime</h3>
          <div
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-8">
            @for (
              uptimeStatistic of monitorDetailStore.uptimeStatistics();
              track uptimeStatistic.name
            ) {
              <section hlmCard>
                <div hlmCardContent>
                  <div class="space-y-2">
                    <p class="text-3xl font-semibold tracking-tight">{{ uptimeStatistic.value }}</p>
                    <p class="text-muted-foreground text-sm">{{ uptimeStatistic.name }}</p>
                  </div>
                </div>
              </section>
            }
          </div>
        </div>

        <div class="grid gap-4">
          <h3 class="text-lg font-bold">Ping</h3>
          <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            @for (pingStatistic of monitorDetailStore.pingStatistics(); track pingStatistic.name) {
              <section hlmCard>
                <div hlmCardContent>
                  <div class="space-y-2">
                    <div class="flex justify-between gap-4">
                      <p class="text-3xl font-semibold tracking-tight">
                        @if (pingStatistic.value?.averagePingMs; as averagePingMs) {
                          {{ averagePingMs }}ms
                        } @else {
                          -
                        }
                      </p>
                      <div>
                        @if (pingStatistic.value?.trendPercentage; as trendPercentage) {
                          @let isPositiveTrend = trendPercentage[0] !== '-';
                          <span
                            class="rounded-lg p-1 text-sm font-normal"
                            [monitor-status-text-background]="isPositiveTrend ? 'UP' : 'DOWN'">
                            {{ trendPercentage }}%
                          </span>
                        }
                      </div>
                    </div>
                    <p class="text-muted-foreground text-sm">{{ pingStatistic.name }}</p>
                  </div>
                </div>
              </section>
            }
          </div>
        </div>
      } @else {
        <hlm-skeleton class="h-52 w-full" />
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
          @defer (on idle) {
            <pu-ping-chart-filter [monitorId]="monitorId()" />
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
    Heatmap,
    MonitorHeaderPlaceholder,
    RouterLink,
    DfxCutPipe,
    TranslocoPipe,
    PingChartFilter,
    MonitorCheckerDataValueLabelPipe,
    Tag,
    ChartPlaceholder,
    HlmSkeletonImports,
    HlmIconImports,
    HlmCardImports,
    HlmBadgeImports,
    MonitorStatusTextBackground,
  ],
})
export class MonitorDetail {
  protected readonly monitorDetailStore = inject(MonitorDetailStore);
  protected readonly monitorDetailYearlyUptimeStore = inject(MonitorDetailsYearlyUptimeStore);
  protected readonly checkResultsPingStore = inject(CheckResultsPingStore);
  protected readonly infiniteCheckResultsStore = inject(InfiniteCheckResultsStore);

  readonly monitorId = input.required<string>();

  readonly cutDescription = signal(true);

  protected readonly testIntervalDuration = computed(() => {
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
  }
}
