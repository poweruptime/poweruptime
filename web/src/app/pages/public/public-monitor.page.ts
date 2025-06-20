import {ChangeDetectionStrategy, Component, DOCUMENT, effect, inject, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

import {GlobalMetadata, NgxMetaService} from '@davidlj95/ngx-meta/core';
import {OpenGraphMetadata} from '@davidlj95/ngx-meta/open-graph';
import {s_cut} from 'dfts-helper';

import {Heatmap, Placeholder, RefreshInComponent} from '@app/components';
import {MonitorStatus, PingChart, UptimeTimeline} from '@app/components/monitor';
import {MonitorDetailsYearlyUptimeStore, PublicMonitorDetailStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (publicMonitorDetailStore.monitor(); as monitor) {
        <div class="flex items-center gap-4">
          <h1 class="text-4xl font-bold">{{ monitor.name }}</h1>

          <pu-monitor-status [status]="monitor.status" />
        </div>

        <mat-card appearance="outlined">
          <mat-card-content>
            <pu-uptime-timeline [checkResults]="monitor.lastCheckResults" />
          </mat-card-content>
        </mat-card>

        <mat-card appearance="outlined">
          <mat-card-content>
            <div
              class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-7">
              @for (
                uptimeResult of publicMonitorDetailStore.uptimeResults();
                track uptimeResult.name
              ) {
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
