import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatIconAnchor, MatIconButton} from '@angular/material/button';
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
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {HlmPaginator} from '@spartan-ng/helm/paginator';
import {StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {TableLoadingBar} from '@app/components';
import {MonitorStatusTextBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {CheckResultsStore} from '@app/services';
import {arrayToParam, paramToArray, trackBy} from '@app/util';

import {BackendType} from '../../../api';
import {dateToDateTime, toBackendDate, toBackendDateTime} from '../../../services/util';

@Component({
  template: `
    <div class="mt-4 flex flex-wrap justify-end">
      <div class="grid grid-cols-2 items-center justify-end gap-4 lg:grid-cols-4">
        @let _showDuplicates = showDuplicates();
        <div class="flex justify-end">
          <mat-slide-toggle
            [checked]="_showDuplicates ?? false"
            (toggleChange)="showDuplicates.set(_showDuplicates ? null : true)"
            labelPosition="before">
            {{ 'general.showDuplicates' | transloco }}
          </mat-slide-toggle>
        </div>

        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'checkResult.list.hasNotification' | transloco }}</mat-label>
          <ng-icon name="bootstrapArrowDownUp" matIconPrefix />
          <mat-select [(ngModel)]="hasNotification">
            @for (states of availableHasNotificationStates(); track states.hasNotification) {
              <mat-option [value]="states.hasNotification">
                {{ states.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

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

    <div class="table-responsive">
      <table
        [dataSource]="checkResultsStore.entities()"
        [matSortActive]="checkResultsStore.sortBy()"
        [matSortDirection]="checkResultsStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <ng-container matColumnDef="monitor">
          <th *matHeaderCellDef mat-header-cell>{{ 'general.monitor' | transloco }}</th>
          <td class="max-w-64 truncate" *matCellDef="let element" mat-cell>
            <a class="underline" [routerLink]="element.monitor.id" stopPropagation>
              {{ element.monitor.name }}
            </a>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.status' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            <span
              class="rounded-md px-2 py-1 font-bold"
              [monitor-status-text-background]="element.status">
              {{ element.status }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="createdAt">
          <th class="whitespace-nowrap" *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.createdAt' | transloco }}
          </th>
          <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
            <pu-relative-time [value]="element.createdAt" format="yyyy.MM.dd HH:mm:ss" />
          </td>
        </ng-container>

        <ng-container matColumnDef="title">
          <th *matHeaderCellDef mat-header-cell>{{ 'general.title' | transloco }}</th>
          <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
            {{ element.title }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th *matHeaderCellDef mat-header-cell></th>
          <td *matCellDef="let element" mat-cell>
            <a
              [matTooltip]="'checkResult.list.action.view' | transloco"
              [attr.aria-label]="'checkResult.list.action.view' | transloco"
              [routerLink]="
                teamId() || (!teamId() && !monitorId())
                  ? element.monitor.id + '/c/' + element.id + '/logs'
                  : 'c/' + element.id + '/logs'
              "
              matTooltipPosition="left"
              mat-icon-button
              stopPropagation>
              <ng-icon name="bootstrapArrowRight" />
            </a>
          </td>
        </ng-container>

        <tr *matHeaderRowDef="checkResultsStore.columnsToDisplay()" mat-header-row></tr>
        <tr
          *matRowDef="let element; columns: checkResultsStore.columnsToDisplay()"
          [routerLink]="
            teamId() || (!teamId() && !monitorId())
              ? element.monitor.id + '/c/' + element.id + '/logs'
              : 'c/' + element.id + '/logs'
          "
          mat-row
          queryParamsHandling="merge"></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="checkResultsStore.isPending()" />

    @if (checkResultsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <hlm-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="checkResultsStore.size()"
      [pageIndex]="checkResultsStore.page()"
      [length]="checkResultsStore.totalElements()"
      showFirstLastButtons />
  `,
  styles: `
    @reference "#styles.css";

    .mat-column-monitor {
      @apply w-64;
    }

    .mat-column-status {
      @apply w-32;
    }

    .mat-column-actions {
      @apply w-24;
    }
  `,
  selector: 'pu-check-result-list',
  providers: [CheckResultsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatSortModule,
    MatSlideToggle,
    RouterLink,
    TableLoadingBar,
    RelativeTimeWithTooltip,
    StopPropagationDirective,
    NgIcon,
    MatIconAnchor,
    TranslocoPipe,
    MatTooltip,
    MonitorStatusTextBackground,
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
    ReactiveFormsModule,
    MatIconButton,
    HlmPaginator,
  ],
})
export class CheckResultList {
  protected readonly max = new Date();

  readonly checkResultsStore = inject(CheckResultsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(MatSort);

  readonly showDuplicates = linkedQueryParam('checks.showDuplicates', {
    parse: paramToBoolean(),
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
    {hasNotification: null, name: 'Ignore'},
    {hasNotification: true, name: 'Has'},
    {hasNotification: false, name: 'Has not'},
  ]);

  constructor() {
    this.checkResultsStore.setShowDuplicates(this.showDuplicates);
    this.checkResultsStore.setHlmPaginator(this.paginator);
    this.checkResultsStore.setSort(this.sort);

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
