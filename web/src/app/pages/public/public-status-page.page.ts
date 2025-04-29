import {DOCUMENT} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

import {GlobalMetadata, NgxMetaService} from '@davidlj95/ngx-meta/core';
import {OpenGraphMetadata} from '@davidlj95/ngx-meta/open-graph';
import {TranslocoPipe} from '@jsverse/transloco';
import {s_cut} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendImage, RefreshInComponent, ShadowRender} from '@app/components';
import {StatusPageMonitorList} from '@app/components/status-page';
import {MonitorStatusColor} from '@app/directives';
import {PublicStatusPageStore} from '@app/services';
import {PublicStatusPageMonitorsStore} from '@app/services/status-page/public-status-page-monitors.store';

import {BACKEND_API_URL} from '../../util';

@Component({
  template: `
    <div class="flex flex-col gap-6">
      @let _preview = preview();
      @if (publicStatusPageStore.isFulfilled()) {
        @if (publicStatusPageStore.statusPage(); as statusPage) {
          <div class="flex items-center gap-4">
            @if (statusPage.image; as image) {
              <pu-backend-image
                class="rounded-xl"
                [fileId]="image.fileId"
                [alt]="statusPage.name + ' Logo'"
                size="75" />
            }
            <h1 class="text-4xl">{{ statusPage.name }}</h1>
          </div>

          <mat-card appearance="outlined">
            <mat-card-content>
              <div class="inline-flex items-center gap-2">
                @if (publicStatusPageMonitorsStore.status() === 'UP') {
                  <bi [monitor-status-color]="'UP'" size="24" name="check-circle-fill" />
                  <span class="text-xl">{{ 'statusPage.public.operational' | transloco }}</span>
                } @else {
                  <bi [monitor-status-color]="'DOWN'" size="24" name="exclamation-circle-fill" />
                  <span class="text-xl">{{ 'statusPage.public.issues' | transloco }}</span>
                }
              </div>
            </mat-card-content>
          </mat-card>

          @if (statusPage.description; as it) {
            <pu-shadow-render [html]="it" />
          }

          <div class="flex flex-col gap-10">
            @for (group of statusPage.groups; track group.id) {
              <div class="flex flex-col gap-2">
                <h2 class="text-xl">{{ group.name }}</h2>

                @if (group.description; as description) {
                  <pu-shadow-render [html]="description" />
                }

                <mat-card appearance="outlined">
                  <mat-card-content>
                    <pu-status-page-monitor-list
                      [slug]="statusPage.slug"
                      [statusPageGroupIds]="[group.id]" />
                  </mat-card-content>
                </mat-card>
              </div>
            }
          </div>

          @if (statusPage.footer; as it) {
            <pu-shadow-render class="mt-20" [html]="it" />
          }
        }

        @if (!_preview) {
          <refresh-in />
        }
      } @else if (publicStatusPageStore.isPending() && !_preview) {
        <refresh-in />
      } @else if (publicStatusPageStore.error()?.httpCode === 404) {
        <h1 class="mt-24 text-center text-4xl">{{ 'statusPage.public.notFound' | transloco }}</h1>
      }
    </div>
  `,
  selector: 'pu-public-status-page-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PublicStatusPageMonitorsStore],
  imports: [
    RefreshInComponent,
    MatCard,
    MatCardContent,
    StatusPageMonitorList,
    BiComponent,
    BackendImage,
    MonitorStatusColor,
    ShadowRender,
    TranslocoPipe,
  ],
})
export class PublicStatusPagePage {
  private readonly ngxMetaService = inject(NgxMetaService);
  private readonly document = inject(DOCUMENT);

  readonly publicStatusPageStore = inject(PublicStatusPageStore);
  readonly publicStatusPageMonitorsStore = inject(PublicStatusPageMonitorsStore);

  statusPageSlug = input<string>();

  preview = input(false, {transform: booleanAttribute});

  readonly host = this.document.location.host;

  readonly imageBaseUrl = `${BACKEND_API_URL}/v1/public/file`;

  constructor() {
    this.publicStatusPageStore.loadBySlug(
      computed(() => ({
        slug: this.statusPageSlug(),
        domain: this.host,
      })),
    );

    this.publicStatusPageMonitorsStore.load(
      computed(() => ({
        ...this.publicStatusPageMonitorsStore.pageable(),
        slug: this.publicStatusPageStore.statusPage()?.slug,
      })),
    );

    effect(() => {
      const statusPage = this.publicStatusPageStore.statusPage();
      const status = this.publicStatusPageMonitorsStore.status();

      if (!statusPage || this.publicStatusPageMonitorsStore.isPending()) {
        return;
      }

      const description = s_cut(
        `${status === 'UP' ? 'All services operational' : 'Some services experience issues'}. ${statusPage.description ?? ''}`,
        200,
        '...',
      );

      this.ngxMetaService.set({
        title: `${statusPage.name} - poweruptime`,
        description,
        openGraph: {
          description,
          type: 'website',
          siteName: 'poweruptime',
          url: this.document.location.href,
          title: statusPage.name,
          image: {
            url: statusPage.image
              ? `${this.imageBaseUrl}/${statusPage.image.fileId}`
              : `${this.document.location.origin}/assets/og-image/${status}.png`,
            alt: statusPage.image
              ? `${statusPage.name} Logo`
              : `Image representing the ${status} status`,
            type: 'image/png',
          },
        },
      } satisfies GlobalMetadata & OpenGraphMetadata);
    });
  }
}
