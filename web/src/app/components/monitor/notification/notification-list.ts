import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerToggle,
  MatEndDate,
  MatStartDate,
} from '@angular/material/datepicker';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';

import {map, tap} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {NotificationsStore} from '@app/services';
import {dateToDateTime, toBackendDate, toBackendDateTime} from '@app/services/util';
import {arrayToParam, paramToArray} from '@app/util';

import {NotificationTable} from './notification-table';
import {NotificationsEmpty} from './notifications-empty';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      @if (notificationsStore.isEmpty()) {
        <pu-notifications-empty />
      } @else {
        <div class="flex flex-wrap justify-end">
          <div class="grid grid-cols-2 items-center justify-end gap-4">
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>{{ 'general.status' | transloco }}</mat-label>
              <ng-icon name="bootstrapArrowDownUp" matIconPrefix />
              <mat-select [(ngModel)]="statuses" multiple>
                @for (status of availableStatuses(); track status.status) {
                  <mat-option [value]="status.status">
                    {{ status.name }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field subscriptSizing="dynamic">
              <mat-label>{{ 'general.startEnd' | transloco }}</mat-label>
              <mat-date-range-input [rangePicker]="picker" [max]="max">
                <input
                  [(ngModel)]="start"
                  [placeholder]="'monitor.details.pingChart.startDate' | transloco"
                  matStartDate />
                <input
                  [(ngModel)]="end"
                  [placeholder]="'monitor.details.pingChart.endDate' | transloco"
                  matEndDate />
              </mat-date-range-input>
              <mat-datepicker-toggle [for]="picker" matIconSuffix></mat-datepicker-toggle>
              <mat-date-range-picker #picker></mat-date-range-picker>
            </mat-form-field>
          </div>
        </div>
        <pu-notification-table [monitorId]="monitorId()" [teamId]="teamId()" />
      }
    </div>
  `,
  selector: 'pu-notification-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationsStore],
  imports: [
    TranslocoPipe,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    FormsModule,
    MatDateRangeInput,
    MatDateRangePicker,
    MatDatepickerToggle,
    MatEndDate,
    MatStartDate,
    MatSuffix,
    HlmIconImports,
    NotificationTable,
    NotificationsEmpty,
  ],
})
export class NotificationList {
  protected readonly max = new Date();

  readonly notificationsStore = inject(NotificationsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  statuses = linkedQueryParam('notifi.status', {
    parse: paramToArray<BackendType['NotificationResponse']['status']>(),
    stringify: arrayToParam(),
  });

  readonly availableStatuses = signal([
    {status: 'UP' as const, name: 'Up'},
    {status: 'DOWN' as const, name: 'Down'},
  ]);

  start = linkedQueryParam('notifi.start', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });
  end = linkedQueryParam('notifi.end', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });

  constructor() {
    this.notificationsStore.load(
      computed(() => {
        const start = this.start();
        const end = this.end();

        console.log(this.teamId(), this.monitorId());
        return {
          teamId: this.teamId(),
          monitorId: this.monitorId(),
          statuses: this.statuses(),
          start: start ? toBackendDateTime(dateToDateTime(start)) : undefined,
          end: end ? toBackendDateTime(dateToDateTime(end)) : undefined,
          ...this.notificationsStore.pageable(),
        };
      }),
    );

    const setColumnsToDisplay = rxMethod<boolean>(
      map((includeMonitorColumn) => {
        let it = ['status', 'createdAt', 'title', 'actions'];

        if (includeMonitorColumn) {
          it = ['monitor', ...it];
        }

        this.notificationsStore.setColumnsToDisplay(it);
      }),
    );

    setColumnsToDisplay(computed(() => !this.monitorId()));
  }
}
