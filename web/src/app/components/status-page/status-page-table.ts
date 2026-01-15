import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDataTableImports} from '@spartan-ng/helm/data-table';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmPaginator, HlmPaginatorImports} from '@spartan-ng/helm/paginator';
import {HlmSort, HlmSortImports} from '@spartan-ng/helm/sort';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';
import {TableLoadingBar} from '@app/components';
import {IsTeamAdmin} from '@app/directives';
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
            <ng-container hlmColumnDef="name">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.name' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>{{ element.name }}</td>
            </ng-container>

            <ng-container hlmColumnDef="slug">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.slug' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>{{ element.slug }}</td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <button
                  *isTeamAdmin
                  [hlmDropdownMenuTrigger]="menu"
                  type="button"
                  hlmBtn
                  stopPropagation
                  variant="ghost">
                  <span class="sr-only">Open status page menu</span>
                  <ng-icon hlm size="sm" name="bootstrapThreeDotsVertical" />
                </button>

                <ng-template #menu>
                  <hlm-dropdown-menu class="w-56">
                    <hlm-dropdown-menu-label>
                      {{ 'general.options' | transloco }}
                    </hlm-dropdown-menu-label>

                    <hlm-dropdown-menu-group>
                      <a [routerLink]="element.slug" hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapPencilSquare" />
                        {{ 'general.edit' | transloco }}
                      </a>
                      <a
                        [routerLink]="element.slug"
                        [queryParams]="{preview: 1}"
                        hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapEye" />
                        {{ 'general.preview' | transloco }}
                      </a>
                      <a [href]="'/public/s/' + element.slug" target="_blank" hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
                        {{ 'general.public' | transloco }} {{ 'general.preview' | transloco }}
                      </a>
                      <button
                        (click)="statusPagesStore.delete(element.slug)"
                        type="button"
                        hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapTrashFill" />
                        {{ 'general.delete' | transloco }}
                      </button>
                    </hlm-dropdown-menu-group>
                  </hlm-dropdown-menu>
                </ng-template>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="statusPagesStore.columnsToDisplay()" hlm-header-row></tr>
            <tr
              class="hover:cursor-pointer"
              *hlmRowDef="let element; columns: statusPagesStore.columnsToDisplay()"
              [routerLink]="element.slug"
              hlm-row></tr>
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
  selector: 'pu-status-page-table',
  imports: [
    RouterLink,
    StopPropagationDirective,
    TranslocoPipe,
    TableLoadingBar,
    IsTeamAdmin,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmPaginatorImports,
    HlmDropdownMenuImports,
    HlmButtonImports,
    HlmIconImports,
    HlmDropdownMenuImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPageTable {
  protected readonly statusPagesStore = inject(StatusPagesStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.statusPagesStore.setHlmPaginator(this.paginator);
    this.statusPagesStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = (_: number, it: BackendType['StatusPageResponse']) => it.slug;
}
