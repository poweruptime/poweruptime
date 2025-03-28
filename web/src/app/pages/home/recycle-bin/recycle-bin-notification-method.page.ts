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
import {NotificationMethodsStore} from '@app/services';

@Component({
  template: `
    <button
      [disabled]="notificationMethodsStore.isPending()"
      (click)="notificationMethodsStore.restoreSelection()"
      mat-flat-button>
      <bi name="arrow-counterclockwise" />
      {{ 'general.restore' | transloco }}
    </button>
    <div class="table-responsive">
      <table
        [dataSource]="notificationMethodsStore.entities()"
        [matSortActive]="notificationMethodsStore.sortBy()"
        [matSortDirection]="notificationMethodsStore.sortDirection()"
        mat-table
        matSort>
        <!-- Checkbox Column -->
        <ng-container matColumnDef="select">
          <th *matHeaderCellDef mat-header-cell>
            <mat-checkbox
              [checked]="
                notificationMethodsStore.hasValue() && notificationMethodsStore.isAllSelected()
              "
              [indeterminate]="
                notificationMethodsStore.hasValue() && !notificationMethodsStore.isAllSelected()
              "
              (change)="$event ? notificationMethodsStore.toggleAll() : null"></mat-checkbox>
          </th>
          <td *matCellDef="let row" mat-cell>
            <mat-checkbox
              [checked]="notificationMethodsStore.isSelected(row)"
              (click)="$event.stopPropagation()"
              (change)="$event ? notificationMethodsStore.toggle(row) : null"></mat-checkbox>
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
            <pu-relative-time [value]="element.deleted" format="YYYY.MM.dd HH:mm:ss" />
          </td>
        </ng-container>

        <tr *matHeaderRowDef="notificationMethodsStore.columnsToDisplay()" mat-header-row></tr>

        <tr
          *matRowDef="let element; columns: notificationMethodsStore.columnsToDisplay()"
          mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="notificationMethodsStore.isPending()" />

    @if (notificationMethodsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="notificationMethodsStore.size()"
      [pageIndex]="notificationMethodsStore.page()"
      [length]="notificationMethodsStore.totalElements()"
      showFirstLastButtons />
  `,
  selector: 'pu-recycle-bin-notification-method-page',
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
  providers: [NotificationMethodsStore],
})
export class RecycleBinNotificationMethodPage {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly teamId = input.required<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.notificationMethodsStore.setColumnsToDisplay(['select', 'name', 'deleted']);
    this.notificationMethodsStore.setStartSort({by: 'deleted', direction: 'desc'});
    this.notificationMethodsStore.setDeleted(true);

    this.notificationMethodsStore.setPaginator(this.paginator);
    this.notificationMethodsStore.setSort(this.sort);

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        deleted: this.notificationMethodsStore.deleted(),
        ...this.notificationMethodsStore.pageable(),
      })),
    );
  }
}
