import {NgOptimizedImage} from '@angular/common';
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

import {RefreshInComponent, ShadowRender} from '@app/components';
import {StatusPageMonitorList} from '@app/components/status-page';
import {MonitorStatusText} from '@app/directives';
import {BackendImagePipe} from '@app/pipes';
import {PublicStatusPageStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-6">
      @let _preview = preview();
      @if (publicStatusPageStore.isFulfilled()) {
        @if (publicStatusPageStore.statusPage(); as statusPage) {
          <div class="flex items-center gap-4">
            @if (statusPage.image; as image) {
              <img
                class="rounded-xl"
                [ngSrc]="image.fileId | backendImage"
                [alt]="statusPage.name + ' Logo'"
                width="75"
                height="75"
                priority />
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
    ShadowRender,
    TranslocoPipe,
    HlmCardImports,
    HlmIconImports,
    MonitorStatusText,
    NgOptimizedImage,
    BackendImagePipe,
  ],
})
export class PublicStatusPagePage {
  private readonly ngxMetaService = inject(NgxMetaService);
  private readonly document = inject(DOCUMENT);
  private readonly host = this.document.location.host;
  private readonly origin = this.document.location.origin;

  readonly publicStatusPageStore = inject(PublicStatusPageStore);

  statusPageSlug = input<string>();

  preview = input(false, {transform: booleanAttribute});

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

      const description =
        status === 'UP' ? 'All services operational' : 'Some services experience issues';

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
            url: `${this.origin}/bff/v1/og/status-page?slug=${statusPage.slug}`,
            alt: `Image showing the name, description and the ${status} status`,
            type: 'image/png',
          },
        },
      } satisfies GlobalMetadata & OpenGraphMetadata);
    });
  }

  public reload() {
    this.publicStatusPageStore.loadBySlug({
      slug: this.statusPageSlug(),
      domain: this.host,
    });
  }
}
