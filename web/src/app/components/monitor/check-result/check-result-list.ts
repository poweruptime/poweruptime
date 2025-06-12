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
import {MatIconAnchor} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatPaginator} from '@angular/material/paginator';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {TableLoadingBar} from '@app/components';
import {MonitorStatusTextBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {CheckResultsStore} from '@app/services';
import {arrayToParam, paramToArray, trackBy} from '@app/util';

import {BackendType} from '../../../api';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="flex flex-wrap justify-between">
            <h2 class="text-xl">{{ 'checkResult.list.title' | transloco }}</h2>

            <div class="flex flex-wrap items-center justify-end gap-2">
              @let _showDuplicates = showDuplicates();
              <mat-slide-toggle
                [checked]="_showDuplicates ?? false"
                (toggleChange)="showDuplicates.set(_showDuplicates ? null : true)"
                labelPosition="before">
                {{ 'general.showDuplicates' | transloco }}
              </mat-slide-toggle>

              <mat-form-field subscriptSizing="dynamic">
                <mat-label>{{ 'general.status' | transloco }}</mat-label>
                <bi name="arrow-down-up" matIconPrefix />
                <mat-select [(ngModel)]="statuses" multiple>
                  @for (status of availableStatuses(); track status.status) {
                    <mat-option [value]="status.status">
                      {{ status.name }}
                    </mat-option>
                  }
                </mat-select>
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
                  <pu-relative-time [value]="element.createdAt" format="YYYY.MM.dd HH:mm:ss" />
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
                    <bi name="arrow-right" />
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

          <mat-paginator
            [pageSizeOptions]="[10, 20, 50, 100, 200]"
            [pageSize]="checkResultsStore.size()"
            [pageIndex]="checkResultsStore.page()"
            [length]="checkResultsStore.totalElements()"
            showFirstLastButtons />
        </mat-card-content>
      </mat-card>
    </div>
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
    MatCard,
    MatCardContent,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    MatSlideToggle,
    RouterLink,
    TableLoadingBar,
    RelativeTimeWithTooltip,
    StopPropagationDirective,
    BiComponent,
    MatIconAnchor,
    TranslocoPipe,
    MatTooltip,
    MonitorStatusTextBackground,
    FormsModule,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
  ],
})
export class CheckResultList {
  readonly checkResultsStore = inject(CheckResultsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  readonly showDuplicates = linkedQueryParam('checks.showDuplicates', {
    parse: paramToBoolean(),
  });

  statuses = linkedQueryParam('checks.status', {
    parse: paramToArray<BackendType['CheckResultResponse']['status']>(),
    stringify: arrayToParam(),
  });

  readonly availableStatuses = signal([
    {status: 'UP' as const, name: 'Up'},
    {status: 'DOWN' as const, name: 'Down'},
    {status: 'MAINTENANCE' as const, name: 'Maintenance'},
    {status: 'PAUSED' as const, name: 'Paused'},
  ]);

  constructor() {
    this.checkResultsStore.setPaginator(this.paginator);
    this.checkResultsStore.setSort(this.sort);
    this.checkResultsStore.setShowDuplicates(this.showDuplicates);
    this.checkResultsStore.setStatuses(this.statuses);

    this.checkResultsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        monitorId: this.monitorId(),
        statuses: this.checkResultsStore.statuses(),
        onlyChanges: !this.checkResultsStore.showDuplicates(),
        ...this.checkResultsStore.pageable(),
      })),
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
