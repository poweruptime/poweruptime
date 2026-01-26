import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';

import {HlmPaginator, HlmPaginatorImports} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCheckboxImports} from '@spartan-ng/helm/checkbox';
import {HlmTableContainer} from '@spartan-ng/helm/table';

import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {MonitorsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="monitorsStore.entities()"
            [hlmSortActive]="monitorsStore.sortBy()"
            [hlmSortDirection]="monitorsStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <!-- Checkbox Column -->
            <ng-container hlmColumnDef="select">
              <th *hlmHeaderCellDef hlm-header-cell>
                <hlm-checkbox
                  [checked]="monitorsStore.isAllSelected()"
                  [indeterminate]="monitorsStore.hasValue() && !monitorsStore.isAllSelected()"
                  (checkedChange)="monitorsStore.toggleAll()" />
              </th>
              <td *hlmCellDef="let row" hlm-cell>
                <hlm-checkbox
                  [checked]="monitorsStore.isSelected(row)"
                  (checkedChange)="monitorsStore.toggle(row)" />
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

            <tr *hlmHeaderRowDef="monitorsStore.columnsToDisplay()" hlm-header-row></tr>

            <tr *hlmRowDef="let element; columns: monitorsStore.columnsToDisplay()" hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="monitorsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="monitorsStore.size()"
        [pageIndex]="monitorsStore.page()"
        [length]="monitorsStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  selector: 'pu-recycle-bin-monitor-table',
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
export class RecycleBinMonitorTable {
  readonly monitorsStore = inject(MonitorsStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.monitorsStore.setColumnsToDisplay(['select', 'name', 'deleted']);
    this.monitorsStore.setStartSort({by: 'deleted', direction: 'desc'});

    this.monitorsStore.setHlmPaginator(this.paginator);
    this.monitorsStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}
