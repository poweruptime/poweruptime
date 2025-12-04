import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {MatButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';

import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {MonitorsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <button
      [disabled]="!monitorsStore.hasValue() || monitorsStore.isPending()"
      (click)="monitorsStore.restoreSelection()"
      type="button"
      mat-flat-button>
      <ng-icon name="bootstrapArrowCounterclockwise" />
      {{ 'general.restore' | transloco }}
    </button>
    <div class="table-responsive">
      <table
        [dataSource]="monitorsStore.entities()"
        [matSortActive]="monitorsStore.sortBy()"
        [matSortDirection]="monitorsStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <!-- Checkbox Column -->
        <ng-container matColumnDef="select">
          <th *matHeaderCellDef mat-header-cell>
            <mat-checkbox
              [checked]="monitorsStore.hasValue() && monitorsStore.isAllSelected()"
              [indeterminate]="monitorsStore.hasValue() && !monitorsStore.isAllSelected()"
              (change)="$event ? monitorsStore.toggleAll() : null"></mat-checkbox>
          </th>
          <td *matCellDef="let row" mat-cell>
            <mat-checkbox
              [checked]="monitorsStore.isSelected(row)"
              (click)="$event.stopPropagation()"
              (change)="$event ? monitorsStore.toggle(row) : null"></mat-checkbox>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.name' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.name }}
          </td>
        </ng-container>

        <ng-container matColumnDef="deleted">
          <th *matHeaderCellDef mat-header-cell>
            {{ 'general.deleted' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            <pu-relative-time [value]="element.deleted" format="yyyy.MM.dd HH:mm:ss" />
          </td>
        </ng-container>

        <tr *matHeaderRowDef="monitorsStore.columnsToDisplay()" mat-header-row></tr>

        <tr *matRowDef="let element; columns: monitorsStore.columnsToDisplay()" mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="monitorsStore.isPending()" />

    @if (monitorsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="monitorsStore.size()"
      [pageIndex]="monitorsStore.page()"
      [length]="monitorsStore.totalElements()"
      showFirstLastButtons />
  `,
  selector: 'pu-recycle-bin-monitor-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatPaginator,
    MatSortModule,
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    MatCheckbox,
    MatButton,
    NgIcon,
  ],
  providers: [MonitorsStore],
})
export class RecycleBinMonitorPage {
  readonly monitorsStore = inject(MonitorsStore);

  readonly teamId = input.required<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.monitorsStore.setColumnsToDisplay(['select', 'name', 'deleted']);
    this.monitorsStore.setStartSort({by: 'deleted', direction: 'desc'});

    this.monitorsStore.setPaginator(this.paginator);
    this.monitorsStore.setSort(this.sort);

    this.monitorsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        deleted: true,
        ...this.monitorsStore.pageable(),
      })),
    );
  }

  protected readonly trackBy = trackBy;
}
