import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {Meta, Title} from '@angular/platform-browser';

import {s_cut} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendImage, Placeholder, RefreshInComponent, ShadowRender} from '@app/components';
import {StatusPageMonitorList} from '@app/components/status-page';
import {MonitorStatusColor} from '@app/directives';
import {PublicStatusPageStore} from '@app/services';
import {PublicStatusPageMonitorsStore} from '@app/services/status-page/public-status-page-monitors.store';

@Component({
  template: `
    <div class="flex flex-col gap-6">
      @if (publicStatusPageStore.isFulfilled()) {
        @if (publicStatusPageStore.statusPage(); as statusPage) {
          <div class="flex items-center gap-4">
            @if (statusPage.image; as image) {
              <pu-backend-image
                class="rounded-xl"
                [fileId]="image.fileId"
                [title]="statusPage.name + ' Logo'"
                size="75" />
            }
            <h1 class="text-4xl">{{ statusPage.name }}</h1>
          </div>

          <mat-card appearance="outlined">
            <mat-card-content>
              <div class="inline-flex items-center gap-2">
                @if (publicStatusPageMonitorsStore.status() === 'UP') {
                  <bi [monitor-status-color]="'UP'" size="24" name="check-circle-fill" />
                  <span class="text-xl">All services operational.</span>
                } @else {
                  <bi [monitor-status-color]="'DOWN'" size="24" name="exclamation-circle-fill" />
                  <span class="text-xl">Some services experience issues.</span>
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

        <refresh-in />
      } @else if (publicStatusPageStore.isPending()) {
        <!-- placeholder -->

        <refresh-in />
      } @else if (publicStatusPageStore.error()?.httpCode === 404) {
        <h1 class="mt-24 text-center text-4xl">404 - Status page not found</h1>
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
    Placeholder,
    BackendImage,
    MonitorStatusColor,
    ShadowRender,
  ],
})
export class PublicStatusPagePage {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly document = inject(DOCUMENT);

  readonly publicStatusPageStore = inject(PublicStatusPageStore);
  readonly publicStatusPageMonitorsStore = inject(PublicStatusPageMonitorsStore);

  statusPageSlug = input<string>();

  readonly host = this.document.location.host;

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

      this.title.setTitle(`${statusPage.name} - poweruptime`);

      this.meta.addTags([
        {
          property: 'og:title',
          content: statusPage.name,
        },
        {
          property: 'og:url',
          content: `${this.document.location.href}`,
        },
      ]);

      this.meta.addTag({
        property: 'og:description',
        content: s_cut(
          `${status === 'UP' ? 'All services operational' : 'Some services experience issues'}. ${statusPage.description ?? ''}`,
          200,
          '...',
        ),
      });
    });
  }
}
