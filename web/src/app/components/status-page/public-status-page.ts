import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType} from '@app/api';
import {Placeholder, RefreshInComponent} from '@app/components';
import {StatusPageMonitorList} from '@app/components/status-page';
import {SanitizeHtmlPipe} from '@app/pipes';

@Component({
  template: `
    <div class="flex flex-col gap-6">
      @if (isStatusPageFulfilled()) {
        @if (statusPage(); as statusPage) {
          <h1 class="text-4xl">{{ statusPage.name }}</h1>

          @if (isMonitorStatusFulfilled()) {
            <mat-card appearance="outlined">
              <mat-card-content>
                <div class="inline-flex items-center gap-2">
                  @if (monitorsStatus() === 'UP') {
                    <bi class="text-green-500" size="24" name="check-circle-fill" />
                    <span class="text-xl">All services operational.</span>
                  } @else {
                    <bi class="text-orange-500" size="24" name="exclamation-circle-fill" />
                    <span class="text-xl">Some services experience issues.</span>
                  }
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <pu-placeholder class="h-14 w-full" />
          }

          @if (statusPage.description; as it) {
            <div [innerHTML]="it | sanitizeHtml"></div>
          }

          <div class="flex flex-col gap-10">
            @for (group of statusPage.groups; track group.id) {
              <div class="flex flex-col gap-2">
                <h2 class="text-xl">{{ group.name }}</h2>

                @if (group.description; as description) {
                  <div [innerHTML]="description | sanitizeHtml"></div>
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
            <div class="mt-20" [innerHTML]="it | sanitizeHtml"></div>
          }
        }

        <refresh-in />
      } @else if (isStatusPagePending()) {
        <!-- placeholder -->

        <refresh-in />
      } @else if (statusPageHttpCode() === 404) {
        <h1 class="mt-24 text-center text-4xl">404 - Status page not found</h1>
      }
    </div>
  `,
  selector: 'pu-public-status-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RefreshInComponent,
    MatCard,
    MatCardContent,
    SanitizeHtmlPipe,
    StatusPageMonitorList,
    BiComponent,
    Placeholder,
  ],
})
export class PublicStatusPage {
  isStatusPagePending = input.required<boolean>();
  isStatusPageFulfilled = input.required<boolean>();
  statusPageHttpCode = input<number>();

  statusPage = input<BackendType['PublicStatusPageResponse']>();

  monitorsStatus = input.required<'UP' | 'DOWN'>();
  isMonitorStatusFulfilled = input.required<boolean>();
}
