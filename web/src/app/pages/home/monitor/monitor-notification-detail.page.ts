import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAnchor} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {
  MatAccordion,
  MatExpansionModule,
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {AlertDirective, CopyIconButton, ShadowRender} from '@app/components';
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
            <pu-relative-time [value]="notification.createdAt" format="YYYY.MM.dd HH:mm:ss" />
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

        @if (notification.message; as message) {
          <mat-card appearance="outlined">
            <mat-card-content>
              <div class="flex items-start justify-between gap-2">
                <span class="whitespace-pre-wrap">{{ message }}</span>
                <pu-copy-icon-button [content]="message" matTooltipPosition="left" />
              </div>
            </mat-card-content>
          </mat-card>
        }

        <div class="grid gap-2">
          <div class="flex justify-end">
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
    MatCard,
    MatCardContent,
    FormsModule,
    CopyIconButton,
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
