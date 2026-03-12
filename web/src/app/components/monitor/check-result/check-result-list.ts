import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmButtonGroupImports} from '@spartan-ng/helm/button-group';
import {HlmDatePickerImports} from '@spartan-ng/helm/date-picker';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmToggleGroupImports} from '@spartan-ng/helm/toggle-group';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {format} from 'date-fns';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {CheckResultsStore} from '@app/services';
import {dateToDateTime, toBackendDate, toBackendDateTime} from '@app/services/util';
import {arrayToParam, paramToArray} from '@app/util';

import {TableFilter, hasActiveFilters} from '../../table-filter';
import {CheckResultTable} from './check-result-table';
import {CheckResultsEmpty} from './check-results-empty';

@Component({
  template: `
    @if (checkResultsStore.isEmpty() && !hasActiveFilters()) {
      <pu-check-results-empty />
    } @else {
      <div class="flex flex-col gap-2">
        <pu-table-filter [key]="tableKey">
          <label class="inline-flex w-full items-center lg:min-w-36" hlmLabel for="showDuplicates">
            {{ 'general.showDuplicates' | transloco }}
            <hlm-switch class="mr-2" id="showDuplicates" [(checked)]="showDuplicates" />
          </label>

          <hlm-toggle-group
            [(value)]="hasNotification"
            hlmButtonGroup
            type="single"
            variant="outline"
            size="sm">
            <button
              (click)="hasNotification.set(null)"
              hlmTooltipTrigger
              type="button"
              hlmBtn
              variant="outline"
              size="sm">
              <ng-icon hlm name="bootstrapBell" size="sm" />
            </button>
            @for (state of availableHasNotificationStates(); track state.hasNotification) {
              <button
                class="data-[state=on]:bg-input/80"
                [value]="state.hasNotification"
                type="button"
                hlmBtn
                hlmToggleGroupItem
                variant="outline"
                size="sm">
                {{ state.name }}
              </button>
            }
          </hlm-toggle-group>

          <brn-select
            class="inline-block"
            [(value)]="statuses"
            [placeholder]="'general.status' | transloco"
            multiple>
            <hlm-select-trigger class="w-full lg:min-w-38">
              <hlm-select-value />
            </hlm-select-trigger>
            <hlm-select-content>
              @for (status of availableStatuses(); track status.status) {
                <hlm-option [value]="status.status">{{ status.name }}</hlm-option>
              }
            </hlm-select-content>
          </brn-select>

          <hlm-date-range-picker
            class="w-full lg:max-w-52"
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
        </pu-table-filter>

        <pu-check-result-table [teamId]="teamId()" [monitorId]="monitorId()" />
      </div>
    }
  `,
  selector: 'pu-check-result-list',
  providers: [CheckResultsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoPipe,
    FormsModule,
    CheckResultTable,
    CheckResultsEmpty,
    HlmIconImports,
    HlmSwitchImports,
    HlmLabelImports,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmToggleGroupImports,
    HlmTooltipImports,
    HlmSelectImports,
    BrnSelectImports,
    HlmDatePickerImports,
    TableFilter,
  ],
})
export class CheckResultList {
  protected readonly tableKey = 'checks';
  protected readonly max = new Date();
  protected readonly toBackendDate = toBackendDate;
  protected readonly formatDates = (dates: [Date | undefined, Date | undefined]) =>
    dates
      .filter((it) => !!it)
      .map((it) => format(it, 'dd.M.yyyy'))
      .reduce((prev, curr, index) => `${prev}${index == 1 ? ' - ' : ''}${curr}`, '');

  readonly checkResultsStore = inject(CheckResultsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  readonly showDuplicates = linkedQueryParam('checks.filter.showDuplicates', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (it) => (it === true ? 'true' : null),
  });

  hasNotification = linkedQueryParam('checks.filter.hasNotification', {
    parse: paramToBoolean(),
  });

  statuses = linkedQueryParam('checks.filter.status', {
    parse: paramToArray<BackendType['CheckResultResponse']['status']>(),
    stringify: arrayToParam(),
  });

  protected readonly start = linkedQueryParam('checks.filter.start', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });
  protected readonly end = linkedQueryParam('checks.filter.end', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });

  protected readonly startDate = computed(() =>
    this.start() ? new Date(this.start()!) : undefined,
  );
  protected readonly endDate = computed(() => (this.end() ? new Date(this.end()!) : undefined));

  protected readonly hasActiveFilters = injectQueryParams(hasActiveFilters(this.tableKey));

  readonly availableStatuses = signal([
    {status: 'UP' as const, name: 'Up'},
    {status: 'DOWN' as const, name: 'Down'},
    {status: 'MAINTENANCE' as const, name: 'Maintenance'},
    {status: 'PAUSED' as const, name: 'Paused'},
  ]);

  readonly availableHasNotificationStates = signal([
    {hasNotification: true, name: 'Include'},
    {hasNotification: false, name: 'Exclude'},
  ]);

  constructor() {
    this.checkResultsStore.setShowDuplicates(this.showDuplicates);

    this.checkResultsStore.load(
      computed(() => {
        const start = this.start();
        const end = this.end();
        return {
          teamId: this.teamId(),
          monitorId: this.monitorId(),
          statuses: this.statuses(),
          hasNotification: this.hasNotification() ?? undefined,
          onlyChanges: !this.checkResultsStore.showDuplicates(),
          start: start ? toBackendDateTime(dateToDateTime(start)) : undefined,
          end: end ? toBackendDateTime(dateToDateTime(end)) : undefined,
          ...this.checkResultsStore.pageable(),
        };
      }),
    );

    const setColumnsToDisplay = rxMethod<boolean>(
      map((includeMonitorColumn) => {
        let it = ['status', 'createdAt', 'title', 'actions'];

        if (includeMonitorColumn) {
          it = ['monitor', ...it];
        }

        this.checkResultsStore.setColumnsToDisplay(it);
      }),
    );

    setColumnsToDisplay(computed(() => !this.monitorId()));
  }
}
