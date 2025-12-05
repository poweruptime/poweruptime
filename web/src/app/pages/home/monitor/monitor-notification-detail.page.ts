import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatButton} from '@angular/material/button';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {AlertDirective, ShadowRender} from '@app/components';
import {MonitorStatus} from '@app/components/monitor';
import {Tag} from '@app/directives';
import {RelativeTimePipe, RelativeTimeWithTooltip} from '@app/pipes';
import {NotificationDetailStore, SubNotificationsStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (notificationDetailStore.notification(); as notification) {
        <div>
          <a mat-stroked-button routerLink="../../../" queryParamsHandling="merge">
            <ng-icon class="me-1" name="bootstrapArrowLeft" />
            <span>{{ notification.monitor.name }}</span>
          </a>
        </div>
        <div class="flex flex-wrap items-end gap-2 text-2xl">
          <pu-monitor-status [status]="notification.checkResult.status" />
          <h1>{{ notification.title }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-2 text-sm">
            <ng-icon name="bootstrapClock" />
            <pu-relative-time [value]="notification.createdAt" format="yyyy.MM.dd HH:mm:ss" />
          </span>

          <a
            class="hover:cursor-pointer"
            [routerLink]="'../../c/' + notification.checkResult.id + '/logs'">
            <mat-chip-option>
              {{ 'notification.detail.openCheckResult' | transloco }}
              <ng-icon name="bootstrapBoxArrowUpRight" size="16" />
            </mat-chip-option>
          </a>
        </div>

        <hr />

        @if (subNotificationsStore.entities().length > 0) {
          <div class="grid gap-2">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-2xl">Notification Deliveries</h2>
              @let _expandAll = expandAll();
              <mat-chip-listbox (change)="expandAll.set(!_expandAll)">
                <mat-chip-option [selected]="_expandAll">
                  <ng-icon name="bootstrapArrowsExpand" />
                </mat-chip-option>
              </mat-chip-listbox>
            </div>

            <mat-accordion class="example-headers-align" multi>
              @for (subNotification of subNotificationsStore.entities(); track subNotification.id) {
                <mat-expansion-panel [expanded]="_expandAll">
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{ subNotification.method.name }}</mat-panel-title>
                    <mat-panel-description>
                      <div class="flex w-full justify-between">
                        <div></div>

                        <span>
                          @if (subNotification.error) {
                            <span pu-tag="RED">Error</span>
                          } @else {
                            Sent {{ subNotification.sentAt | relativeTime }}
                          }
                        </span>
                      </div>
                    </mat-panel-description>
                  </mat-expansion-panel-header>

                  <pu-shadow-render [html]="subNotification.title" />

                  @if (subNotification.message; as message) {
                    <pu-shadow-render [html]="message" />
                  }

                  @if (subNotification.error; as error) {
                    <div puAlert type="WARN">
                      <strong>Error:</strong>
                      {{ error }}
                    </div>
                  }
                </mat-expansion-panel>
              }
            </mat-accordion>
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center gap-2 pt-4">
            <ng-icon size="28" name="bootstrapBell" />

            <h2 class="mb-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
              Stay in the loop — set up notifications
            </h2>

            <p class="mb-4 max-w-md text-center text-gray-600 dark:text-gray-300">
              This monitor doesn’t have any notification methods linked yet. Add one now to get
              alerts when something important happens.
            </p>

            <a routerLink="/t/{{ notification.team.id }}/notification-methods" mat-flat-button>
              Create or edit notification methods
            </a>
          </div>
        }
      }
    </div>
  `,
  selector: 'monitor-check-result-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    RouterLink,
    FormsModule,
    MonitorStatus,
    RelativeTimeWithTooltip,
    RelativeTimePipe,
    TranslocoPipe,
    MatChipListbox,
    MatChipOption,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    ShadowRender,
    Tag,
    AlertDirective,
    MatButton,
  ],
})
export class MonitorNotificationDetailPage {
  readonly notificationDetailStore = inject(NotificationDetailStore);
  readonly subNotificationsStore = inject(SubNotificationsStore);

  readonly notificationId = input<string>();

  readonly expandAll = linkedQueryParam('expand', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (value) => (!value ? null : value),
    queryParamsHandling: '',
  });

  constructor() {
    this.notificationDetailStore.loadById(this.notificationId);
    this.subNotificationsStore.load(this.notificationId);
  }
}
