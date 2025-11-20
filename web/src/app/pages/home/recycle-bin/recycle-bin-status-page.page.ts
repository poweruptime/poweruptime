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
import {BiComponent} from 'dfx-bootstrap-icons';

import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {StatusPagesStore} from '@app/services';

import {BackendType} from '../../../api';

@Component({
  template: `
    <button
      [disabled]="!statusPagesStore.hasValue() || statusPagesStore.isPending()"
      (click)="statusPagesStore.restoreSelection()"
      type="button"
      mat-flat-button>
      <bi name="arrow-counterclockwise" />
      {{ 'general.restore' | transloco }}
    </button>
    <div class="table-responsive">
      <table
        [dataSource]="statusPagesStore.entities()"
        [matSortActive]="statusPagesStore.sortBy()"
        [matSortDirection]="statusPagesStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <!-- Checkbox Column -->
        <ng-container matColumnDef="select">
          <th *matHeaderCellDef mat-header-cell>
            <mat-checkbox
              [checked]="statusPagesStore.hasValue() && statusPagesStore.isAllSelected()"
              [indeterminate]="statusPagesStore.hasValue() && !statusPagesStore.isAllSelected()"
              (change)="$event ? statusPagesStore.toggleAll() : null"></mat-checkbox>
          </th>
          <td *matCellDef="let row" mat-cell>
            <mat-checkbox
              [checked]="statusPagesStore.isSelected(row)"
              (click)="$event.stopPropagation()"
              (change)="$event ? statusPagesStore.toggle(row) : null"></mat-checkbox>
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

        <tr *matHeaderRowDef="statusPagesStore.columnsToDisplay()" mat-header-row></tr>

        <tr *matRowDef="let element; columns: statusPagesStore.columnsToDisplay()" mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="statusPagesStore.isPending()" />

    @if (statusPagesStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="statusPagesStore.size()"
      [pageIndex]="statusPagesStore.page()"
      [length]="statusPagesStore.totalElements()"
      showFirstLastButtons />
  `,
  selector: 'pu-recycle-bin-status-page-page',
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
    BiComponent,
  ],
  providers: [StatusPagesStore],
})
export class RecycleBinStatusPagePage {
  readonly statusPagesStore = inject(StatusPagesStore);

  readonly teamId = input.required<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.statusPagesStore.setColumnsToDisplay(['select', 'name', 'deleted']);
    this.statusPagesStore.setStartSort({by: 'deleted', direction: 'desc'});
    this.statusPagesStore.setDeleted(true);

    this.statusPagesStore.setPaginator(this.paginator);
    this.statusPagesStore.setSort(this.sort);

    this.statusPagesStore.load(
      computed(() => ({
        teamId: this.teamId(),
        deleted: this.statusPagesStore.deleted(),
        ...this.statusPagesStore.pageable(),
      })),
    );
  }

  protected readonly trackBy = (_: number, it: BackendType['StatusPageResponse']) => it.slug;
}
