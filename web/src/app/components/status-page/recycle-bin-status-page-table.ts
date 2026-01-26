import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';

import {HlmPaginator, HlmPaginatorImports} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCheckboxImports} from '@spartan-ng/helm/checkbox';
import {HlmTableContainer} from '@spartan-ng/helm/table';

import {BackendType} from '@app/api';
import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {StatusPagesStore} from '@app/services';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="statusPagesStore.entities()"
            [hlmSortActive]="statusPagesStore.sortBy()"
            [hlmSortDirection]="statusPagesStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <!-- Checkbox Column -->
            <ng-container hlmColumnDef="select">
              <th *hlmHeaderCellDef hlm-header-cell>
                <hlm-checkbox
                  [checked]="statusPagesStore.isAllSelected()"
                  [indeterminate]="statusPagesStore.hasValue() && !statusPagesStore.isAllSelected()"
                  (checkedChange)="statusPagesStore.toggleAll()" />
              </th>
              <td *hlmCellDef="let row" hlm-cell>
                <hlm-checkbox
                  [checked]="statusPagesStore.isSelected(row)"
                  (checkedChange)="statusPagesStore.toggle(row)" />
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

            <tr *hlmHeaderRowDef="statusPagesStore.columnsToDisplay()" hlm-header-row></tr>

            <tr *hlmRowDef="let element; columns: statusPagesStore.columnsToDisplay()" hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="statusPagesStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="statusPagesStore.size()"
        [pageIndex]="statusPagesStore.page()"
        [length]="statusPagesStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  selector: 'pu-recycle-bin-status-page-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmPaginatorImports,
    HlmCheckboxImports,
  ],
})
export class RecycleBinStatusPageTable {
  readonly statusPagesStore = inject(StatusPagesStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.statusPagesStore.setColumnsToDisplay(['select', 'name', 'deleted']);
    this.statusPagesStore.setStartSort({by: 'deleted', direction: 'desc'});
    this.statusPagesStore.setDeleted(true);

    this.statusPagesStore.setHlmPaginator(this.paginator);
    this.statusPagesStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = (_: number, it: BackendType['StatusPageResponse']) => it.slug;
}
