import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerToggle,
  MatEndDate,
  MatStartDate,
} from '@angular/material/datepicker';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BrnSelect, BrnSelectImports} from '@spartan-ng/brain/select';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmButtonGroupImports} from '@spartan-ng/helm/button-group';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmPaginator} from '@spartan-ng/helm/paginator';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSort} from '@spartan-ng/helm/sort';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {HlmToggleGroupImports} from '@spartan-ng/helm/toggle-group';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {CheckResultsStore} from '@app/services';
import {dateToDateTime, toBackendDate, toBackendDateTime} from '@app/services/util';
import {arrayToParam, paramToArray, trackBy} from '@app/util';

import {CheckResultTable} from './check-result-table';
import {CheckResultsEmpty} from './check-results-empty';

@Component({
  template: `
    @if (checkResultsStore.isEmpty()) {
      <pu-check-results-empty />
    } @else {
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap justify-end">
          <div class="grid grid-cols-2 items-center justify-end gap-4 lg:grid-cols-4">
            <div class="flex justify-end">
              <label class="inline-flex items-center" hlmLabel>
                {{ 'general.showDuplicates' | transloco }}
                <hlm-switch class="mr-2" [(checked)]="showDuplicates" />
              </label>
            </div>

            <hlm-toggle-group
              [(value)]="hasNotification"
              hlmButtonGroup
              type="single"
              variant="outline"
              size="sm">
              <button
                [value]="null"
                hlmTooltipTrigger
                type="button"
                hlmBtn
                variant="outline"
                size="sm">
                <ng-icon (click)="hasNotification.set(null)" hlm name="bootstrapBell" size="sm" />
              </button>
              @let _hasNotification = hasNotification();
              @for (state of availableHasNotificationStates(); track state.hasNotification) {
                <button
                  class="data-[state=on]:bg-input/80"
                  [value]="state.hasNotification"
                  hlmBtn
                  hlmToggleGroupItem
                  variant="outline"
                  size="sm">
                  {{ state.name }}
                </button>
              }
            </hlm-toggle-group>

            <brn-select class="inline-block" placeholder="Select an option">
              <hlm-select-trigger class="w-56">
                <hlm-select-value />
              </hlm-select-trigger>
              <hlm-select-content>
                <hlm-option value="Refresh">Refresh</hlm-option>
                <hlm-option value="Settings">Settings</hlm-option>
                <hlm-option value="Help">Help</hlm-option>
                <hlm-option value="Signout">Sign out</hlm-option>
              </hlm-select-content>
            </brn-select>

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
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatDateRangeInput,
    MatDateRangePicker,
    MatDatepickerToggle,
    MatEndDate,
    MatStartDate,
    MatSuffix,
    HlmIconImports,
    CheckResultTable,
    CheckResultsEmpty,
    HlmSwitchImports,
    HlmLabelImports,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmToggleGroupImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
    HlmSelectImports,
    BrnSelectImports,
  ],
})
export class CheckResultList {
  protected readonly max = new Date();

  readonly checkResultsStore = inject(CheckResultsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  readonly showDuplicates = linkedQueryParam('checks.showDuplicates', {
    parse: paramToBoolean({defaultValue: false}),
  });

  hasNotification = linkedQueryParam('checks.hasNotification', {
    parse: paramToBoolean(),
  });

  statuses = linkedQueryParam('checks.status', {
    parse: paramToArray<BackendType['CheckResultResponse']['status']>(),
    stringify: arrayToParam(),
  });

  start = linkedQueryParam('checks.start', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });
  end = linkedQueryParam('checks.end', {
    parse: (it) => (it ? toBackendDate(it) : undefined),
    stringify: (it) => (it ? toBackendDate(it) : undefined),
  });

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
    this.checkResultsStore.setHlmPaginator(this.paginator);
    this.checkResultsStore.setHlmSort(this.sort);

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

  protected readonly trackBy = trackBy;
}
