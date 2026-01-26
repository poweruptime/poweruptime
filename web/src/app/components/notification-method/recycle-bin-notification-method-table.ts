import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';

import {HlmPaginator, HlmPaginatorImports} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCheckboxImports} from '@spartan-ng/helm/checkbox';
import {HlmTableContainer} from '@spartan-ng/helm/table';

import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {NotificationMethodsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="notificationMethodsStore.entities()"
            [hlmSortActive]="notificationMethodsStore.sortBy()"
            [hlmSortDirection]="notificationMethodsStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <!-- Checkbox Column -->
            <ng-container hlmColumnDef="select">
              <th *hlmHeaderCellDef hlm-header-cell>
                <hlm-checkbox
                  [checked]="notificationMethodsStore.isAllSelected()"
                  [indeterminate]="
                    notificationMethodsStore.hasValue() && !notificationMethodsStore.isAllSelected()
                  "
                  (checkedChange)="notificationMethodsStore.toggleAll()" />
              </th>
              <td *hlmCellDef="let row" hlm-cell>
                <hlm-checkbox
                  [checked]="notificationMethodsStore.isSelected(row)"
                  (checkedChange)="notificationMethodsStore.toggle(row)" />
              </td>
            </ng-container>

            <ng-container hlmColumnDef="name">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.name' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.name }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="deleted">
              <th *hlmHeaderCellDef hlm-header-cell>
                {{ 'general.deleted' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <pu-relative-time [value]="element.deleted" format="yyyy.MM.dd HH:mm:ss" />
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="notificationMethodsStore.columnsToDisplay()" hlm-header-row></tr>

            <tr
              *hlmRowDef="let element; columns: notificationMethodsStore.columnsToDisplay()"
              hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="notificationMethodsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="notificationMethodsStore.size()"
        [pageIndex]="notificationMethodsStore.page()"
        [length]="notificationMethodsStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  selector: 'pu-recycle-bin-notification-method-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmCheckboxImports,
    HlmPaginatorImports,
  ],
})
export class RecycleBinNotificationMethodTable {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.notificationMethodsStore.setColumnsToDisplay(['select', 'name', 'deleted']);
    this.notificationMethodsStore.setStartSort({by: 'deleted', direction: 'desc'});
    this.notificationMethodsStore.setDeleted(true);

    this.notificationMethodsStore.setHlmPaginator(this.paginator);
    this.notificationMethodsStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}
