import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';

import {GlobalMetadata, NgxMetaService} from '@davidlj95/ngx-meta/core';
import {OpenGraphMetadata} from '@davidlj95/ngx-meta/open-graph';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {s_cut} from 'dfts-helper';

import {BackendImage, RefreshInComponent, ShadowRender} from '@app/components';
import {StatusPageMonitorList} from '@app/components/status-page';
import {MonitorStatusText} from '@app/directives';
import {PublicStatusPageStore} from '@app/services';
import {BACKEND_API_URL} from '@app/util';

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
            <h1 class="text-4xl font-bold">{{ statusPage.name }}</h1>
          </div>

          <section hlmCard>
            <div class="inline-flex items-center gap-2" hlmCardContent>
              @if (publicStatusPageStore.status() === 'UP') {
                <ng-icon
                  [monitor-status-text]="'UP'"
                  hlm
                  size="lg"
                  name="bootstrapCheckCircleFill" />
                <span class="text-xl">{{ 'statusPage.public.operational' | transloco }}</span>
              } @else {
                <ng-icon
                  [monitor-status-text]="'DOWN'"
                  hlm
                  size="lg"
                  name="bootstrapExclamationCircleFill" />
                <span class="text-xl">{{ 'statusPage.public.issues' | transloco }}</span>
              }
            </div>
          </section>

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

                <section hlmCard>
                  <div hlmCardContent>
                    <pu-status-page-monitor-list [monitors]="group.monitors" />
                  </div>
                </section>
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
  imports: [
    RefreshInComponent,
    StatusPageMonitorList,
    BackendImage,
    ShadowRender,
    TranslocoPipe,
    HlmCardImports,
    HlmIconImports,
    MonitorStatusText,
  ],
})
export class PublicStatusPagePage {
  private readonly ngxMetaService = inject(NgxMetaService);
  private readonly document = inject(DOCUMENT);

  readonly publicStatusPageStore = inject(PublicStatusPageStore);

  statusPageSlug = input<string>();

  preview = input(false, {transform: booleanAttribute});

  readonly host = this.document.location.host;

  readonly imageBaseUrl = `${this.document.location.origin}${BACKEND_API_URL}/v1/public/file`;

  constructor() {
    this.publicStatusPageStore.loadBySlug(
      computed(() => ({
        slug: this.statusPageSlug(),
        domain: this.host,
      })),
    );

    effect(() => {
      const statusPage = this.publicStatusPageStore.statusPage();

      if (!statusPage) {
        return;
      }

      const status = this.publicStatusPageStore.status();

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
