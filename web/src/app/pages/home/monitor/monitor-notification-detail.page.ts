import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAnchor} from '@angular/material/button';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {AlertDirective, ShadowRender} from '@app/components';
import {MonitorStatus} from '@app/components/monitor';
import {NotificationDetailStore, SubNotificationsStore} from '@app/services';

import {Tag} from '../../../directives';
import {RelativeTimePipe, RelativeTimeWithTooltip} from '../../../pipes';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @if (notificationDetailStore.notification(); as notification) {
        <div>
          <a mat-stroked-button routerLink="../../../" queryParamsHandling="merge">
            <bi class="me-1" name="arrow-left" />
            <span>{{ notification.monitor.name }}</span>
          </a>
        </div>
        <div class="flex flex-wrap items-end gap-2 text-2xl">
          <pu-monitor-status [status]="notification.checkResult.status" />
          <h1>{{ notification.title }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="flex items-center gap-2 text-sm">
            <bi name="clock" />
            <pu-relative-time [value]="notification.createdAt" format="yyyy.MM.dd HH:mm:ss" />
          </span>

          <a
            class="hover:cursor-pointer"
            [routerLink]="'../../c/' + notification.checkResult.id + '/logs'">
            <mat-chip-option>
              {{ 'notification.detail.openCheckResult' | transloco }}
              <bi name="box-arrow-up-right" size="16" />
            </mat-chip-option>
          </a>
        </div>

        <hr />

        <div class="grid gap-2">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl">Notification Deliveries</h2>
            @let _expandAll = expandAll();
            <mat-chip-listbox (change)="expandAll.set(!_expandAll)">
              <mat-chip-option [selected]="_expandAll">
                <bi name="arrows-expand" />
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
                        @if (subNotification.error; as error) {
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
      }
    </div>
  `,
  selector: 'monitor-check-result-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BiComponent,
    MatAnchor,
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
  ],
})
export class MonitorNotificationDetailPage {
  readonly notificationDetailStore = inject(NotificationDetailStore);
  readonly subNotificationsStore = inject(SubNotificationsStore);

  readonly notificationId = input<string>();

  readonly accordion = viewChild(MatAccordion);

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
