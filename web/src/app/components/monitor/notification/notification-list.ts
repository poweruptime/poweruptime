import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCollapsibleImports} from '@spartan-ng/helm/collapsible';
import {HlmDateRangePicker} from '@spartan-ng/helm/date-picker';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {format} from 'date-fns';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {NotificationsStore} from '@app/services';
import {dateToDateTime, toBackendDate, toBackendDateTime} from '@app/services/util';
import {arrayToParam, paramToArray} from '@app/util';

import {NotificationTable} from './notification-table';
import {NotificationsEmpty} from './notifications-empty';

@Component({
  template: `
    @let _activeFiltersCount = activeFiltersCount();
    @let hasActiveFilters = _activeFiltersCount > 0;
    @if (notificationsStore.isEmpty() && !hasActiveFilters) {
      <pu-notifications-empty />
    } @else {
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap justify-end">
          <hlm-collapsible
            class="flex flex-col items-end gap-2 lg:flex-row lg:flex-row-reverse lg:items-center lg:justify-end">
            <button
              class="relative"
              hlmBtn
              hlmCollapsibleTrigger
              variant="outline"
              size="icon"
              type="button">
              <ng-icon hlm name="bootstrapFilter" size="sm" />
              @if (hasActiveFilters) {
                <span
                  class="absolute -top-2 left-full flex min-w-5 -translate-x-1/2 items-center justify-center rounded-full px-1 py-[1px]"
                  hlmBadge
                  variant="destructive">
                  {{ _activeFiltersCount }}
                </span>
              }
            </button>
            <hlm-collapsible-content
              class="grid grid-cols-2 items-center justify-end gap-4 lg:flex">
              <brn-select
                class="inline-block"
                [(value)]="statuses"
                [placeholder]="'general.status' | transloco"
                multiple>
                <hlm-select-trigger>
                  <hlm-select-value class="min-w-38" />
                </hlm-select-trigger>
                <hlm-select-content>
                  @for (status of availableStatuses(); track status.status) {
                    <hlm-option [value]="status.status">{{ status.name }}</hlm-option>
                  }
                </hlm-select-content>
              </brn-select>

              <hlm-date-range-picker
                class="max-w-52"
                [max]="max"
                [autoCloseOnEndSelection]="true"
                [formatDates]="formatDates"
                [date]="startDate() && endDate() ? [startDate()!, endDate()!] : undefined"
                (dateChange)="
                  start.set(toBackendDate($event![0]!)); end.set(toBackendDate($event![1]!))
                "
                buttonId="rangePicker">
                <span>{{ 'general.startEnd' | transloco }}</span>
              </hlm-date-range-picker>
            </hlm-collapsible-content>
          </hlm-collapsible>
        </div>
        <pu-notification-table [monitorId]="monitorId()" [teamId]="teamId()" />
      </div>
    }
  `,
  selector: 'pu-notification-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationsStore],
  imports: [
    TranslocoPipe,
    FormsModule,
    HlmIconImports,
    NotificationTable,
    NotificationsEmpty,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCollapsibleImports,
    HlmSelectImports,
    BrnSelectImports,
    HlmDateRangePicker,
  ],
})
export class NotificationList {
  protected readonly max = new Date();
  protected readonly toBackendDate = toBackendDate;
  protected readonly formatDates = (dates: [Date | undefined, Date | undefined]) =>
    dates
      .filter((it) => !!it)
      .map((it) => format(it, 'dd.M.yyyy'))
      .reduce((prev, curr, index) => `${prev}${index == 1 ? ' - ' : ''}${curr}`, '');

  readonly notificationsStore = inject(NotificationsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  statuses = linkedQueryParam('notifi.filter.status', {
    parse: paramToArray<BackendType['NotificationResponse']['status']>(),
    stringify: arrayToParam(),
  });

  start = linkedQueryParam('notifi.filter.start', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });
  end = linkedQueryParam('notifi.filter.end', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });

  protected readonly startDate = computed(() =>
    this.start() ? new Date(this.start()!) : undefined,
  );
  protected readonly endDate = computed(() => (this.end() ? new Date(this.end()!) : undefined));

  protected readonly activeFiltersCount = injectQueryParams(
    (params) => Object.keys(params).filter((it) => it.startsWith('notifi.filter.')).length,
  );

  protected readonly availableStatuses = signal([
    {status: 'UP' as const, name: 'Up'},
    {status: 'DOWN' as const, name: 'Down'},
  ]);

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
