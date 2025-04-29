import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, effect, inject, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

import {GlobalMetadata, NgxMetaService} from '@davidlj95/ngx-meta/core';
import {OpenGraphMetadata} from '@davidlj95/ngx-meta/open-graph';
import {AreaChartModule} from '@swimlane/ngx-charts';
import {s_cut} from 'dfts-helper';

import {Heatmap, Placeholder, RefreshInComponent} from '@app/components';
import {MonitorStatus, PingChart, UptimeTimeline} from '@app/components/monitor';
import {MonitorDetailsYearlyUptimeStore, PublicMonitorDetailStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (publicMonitorDetailStore.monitor(); as monitor) {
        <div class="flex items-center justify-between">
          <h1 class="text-4xl">{{ monitor.name }}</h1>

          <pu-monitor-status [status]="monitor.status" animate />
        </div>

        <mat-card appearance="outlined">
          <mat-card-content>
            <pu-uptime-timeline [checkResults]="monitor.lastCheckResults" />
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-content>
            <div
              class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              @for (
                uptimeResult of publicMonitorDetailStore.uptimeResults();
                track uptimeResult.name
              ) {
                <div
                  class="flex flex-col items-center justify-center rounded-md bg-gray-200 p-4 transition duration-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <span class="text-2xl">{{ uptimeResult.value }}</span>
                  <span class="text-lg">{{ uptimeResult.name }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      @defer (hydrate on hover) {
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

      <!-- Hyrdate breaks the chart-->
      @defer (on idle) {
        @if (publicMonitorDetailStore.isPending()) {
          <pu-placeholder class="w-full" style="height: 28rem" />
        } @else {
          <mat-card appearance="outlined">
            <mat-card-content>
              <pu-ping-chart [chart]="publicMonitorDetailStore.pingChart()" />
            </mat-card-content>
          </mat-card>
        }
      } @placeholder {
        <pu-placeholder class="w-full" style="height: 28rem" />
      }

      <refresh-in />
    </div>
  `,

  selector: 'public-monitor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    AreaChartModule,
    RefreshInComponent,
    Heatmap,
    UptimeTimeline,
    PingChart,
    MonitorStatus,
    Placeholder,
  ],
})
export class PublicMonitorPage {
  private readonly ngxMetaService = inject(NgxMetaService);
  private readonly document = inject(DOCUMENT);

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
            url: `${this.document.location.origin}/assets/og-image/${monitor.status}.png`,
            alt: `Image representing the ${monitor.status} status`,
            type: 'image/png',
          },
        },
      } satisfies GlobalMetadata & OpenGraphMetadata);
    });
  }
}
