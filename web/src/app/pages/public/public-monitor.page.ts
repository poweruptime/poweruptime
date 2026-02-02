import {ChangeDetectionStrategy, Component, DOCUMENT, effect, inject, input} from '@angular/core';

import {GlobalMetadata, NgxMetaService} from '@davidlj95/ngx-meta/core';
import {OpenGraphMetadata} from '@davidlj95/ngx-meta/open-graph';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {s_cut} from 'dfts-helper';

import {Heatmap, RefreshInComponent} from '@app/components';
import {MonitorStatus, PingChart, UptimeTimeline} from '@app/components/monitor';
import {MonitorStatusTextBackground} from '@app/directives';
import {MonitorDetailsYearlyUptimeStore, PublicMonitorDetailStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-8">
      @if (publicMonitorDetailStore.monitor(); as monitor) {
        <div class="flex items-center gap-4">
          <h1 class="text-4xl font-bold">{{ monitor.name }}</h1>

          <pu-monitor-status [status]="monitor.status" />
        </div>

        <section class="gap-2" hlmCard>
          <div hlmCardHeader>
            <h3 class="text-lg" hlmCardTitle>{{ 'monitor.details.latestChecks' | transloco }}</h3>
          </div>
          <div hlmCardContent>
            <pu-uptime-timeline [checkResults]="monitor.lastCheckResults" />
          </div>
        </section>

        <div class="grid gap-4">
          <h3 class="text-lg font-bold">Uptime</h3>
          <div
            class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7">
            @for (
              uptimeStatistic of publicMonitorDetailStore.uptimeStatistics();
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
            @for (
              pingStatistic of publicMonitorDetailStore.pingStatistics();
              track pingStatistic.name
            ) {
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
      }

      @defer (hydrate on hover) {
        @if (monitorDetailYearlyUptimeStore.isPending()) {
          <hlm-skeleton class="h-64 w-full" />
        } @else {
          <section hlmCard>
            <div hlmCardContent>
              <pu-heatmap [entries]="monitorDetailYearlyUptimeStore.entities()" />
            </div>
          </section>
        }
      } @placeholder {
        <hlm-skeleton class="h-64 w-full" />
      }

      <!-- Hyrdate breaks the chart-->
      @defer (on idle) {
        @if (publicMonitorDetailStore.isPending()) {
          <hlm-skeleton class="w-full" style="height: 28rem" />
        } @else {
          <section hlmCard>
            <div hlmCardContent>
              <pu-ping-chart [chart]="publicMonitorDetailStore.pingChart()" />
            </div>
          </section>
        }
      } @placeholder {
        <hlm-skeleton class="w-full" style="height: 28rem" />
      }

      <refresh-in />
    </div>
  `,

  selector: 'public-monitor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RefreshInComponent,
    Heatmap,
    UptimeTimeline,
    PingChart,
    MonitorStatus,
    HlmSkeletonImports,
    HlmCardImports,
    TranslocoPipe,
    MonitorStatusTextBackground,
  ],
})
export class PublicMonitorPage {
  private readonly ngxMetaService = inject(NgxMetaService);
  private readonly document = inject(DOCUMENT);
  private readonly origin = this.document.location.origin;

  readonly monitorId = input<string>();

  readonly publicMonitorDetailStore = inject(PublicMonitorDetailStore);
  readonly monitorDetailYearlyUptimeStore = inject(MonitorDetailsYearlyUptimeStore);

  constructor() {
    this.publicMonitorDetailStore.loadMonitorById(this.monitorId);
    this.monitorDetailYearlyUptimeStore.loadByMonitorId(this.monitorId);

    effect(() => {
      const monitor = this.publicMonitorDetailStore.monitor();

      if (!monitor) {
        return;
      }

      const title = `${monitor.name} monitor`;
      const description = s_cut(
        `${monitor.status === 'UP' ? 'Service operational.' : 'Service experiences issues'}. ${monitor.description ?? ''}`,
        200,
        '...',
      );

      this.ngxMetaService.set({
        title: `${title} - poweruptime`,
        description,
        openGraph: {
          description,
          type: 'website',
          siteName: 'poweruptime',
          url: this.document.location.href,
          title: `${title} - ${monitor.status}`,
          image: {
            url: `${this.origin}/bff/v1/og/monitor?id=${monitor.id}`,
            alt: `Image showing the name, description and the ${monitor.status} status`,
            type: 'image/png',
          },
        },
      } satisfies GlobalMetadata & OpenGraphMetadata);
    });
  }
}
