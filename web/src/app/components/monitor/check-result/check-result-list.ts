import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {MatIconAnchor} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatPaginator} from '@angular/material/paginator';
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
import {MonitorStatusBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {CheckResultsStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="flex justify-between">
            <h2 class="text-xl">{{ 'checkResult.list.title' | transloco }}</h2>
            @let _showDuplicates = showDuplicates();
            <mat-slide-toggle
              [checked]="_showDuplicates ?? false"
              (toggleChange)="showDuplicates.set(_showDuplicates ? null : true)"
              labelPosition="before">
              {{ 'general.showDuplicates' | transloco }}
            </mat-slide-toggle>
          </div>

          <table
            [dataSource]="checkResultsStore.entities()"
            [matSortActive]="checkResultsStore.sortBy()"
            [matSortDirection]="checkResultsStore.sortDirection()"
            mat-table
            matSort>
            <ng-container matColumnDef="monitor">
              <th *matHeaderCellDef mat-header-cell>{{ 'general.monitor' | transloco }}</th>
              <td *matCellDef="let element" mat-cell>
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
                  [monitor-status-background]="element.status">
                  {{ element.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th *matHeaderCellDef mat-header-cell mat-sort-header>
                {{ 'general.createdAt' | transloco }}
              </th>
              <td *matCellDef="let element" mat-cell>
                <pu-relative-time [value]="element.createdAt" format="YYYY.MM.dd HH:mm:ss" />
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th *matHeaderCellDef mat-header-cell>{{ 'general.title' | transloco }}</th>
              <td *matCellDef="let element" mat-cell>{{ element.title }}</td>
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
    .mat-column-monitor {
      @apply w-52;
    }

    .mat-column-status {
      @apply w-32;
    }

    .mat-column-createdAt {
      @apply w-52;
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
    MonitorStatusBackground,
    MatSlideToggle,
    RouterLink,
    TableLoadingBar,
    RelativeTimeWithTooltip,
    StopPropagationDirective,
    BiComponent,
    MatIconAnchor,
    TranslocoPipe,
    MatTooltip,
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

  constructor() {
    this.checkResultsStore.setPaginator(this.paginator);
    this.checkResultsStore.setSort(this.sort);
    this.checkResultsStore.setShowDuplicates(this.showDuplicates);

    this.checkResultsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        monitorId: this.monitorId(),
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
}
