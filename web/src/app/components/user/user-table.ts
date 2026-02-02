import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';

import {HlmPaginator, HlmPaginatorImports} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {InitialsPipe} from '@spartan-ng/brain/avatar';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {UsersStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="usersStore.entities()"
            [hlmSortActive]="usersStore.sortBy()"
            [hlmSortDirection]="usersStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <ng-container hlmColumnDef="name">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.name' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <div class="flex items-center gap-1.5">
                  <hlm-avatar class="rounded-lg after:rounded-lg">
                    <span class="bg-muted text-muted-foreground rounded-lg" hlmAvatarFallback>
                      {{ element.name | initials }}
                    </span>
                  </hlm-avatar>
                  <div class="inline-flex flex-col gap-1">
                    <div class="inline-flex items-center gap-2">
                      <span>{{ element.name }}</span>
                      @if (element.role === 'ADMIN') {
                        <span
                          class="bg-primary text-primary-foreground"
                          hlmBadge
                          variant="secondary">
                          <ng-icon name="bootstrapStarFill" />
                          Admin
                        </span>
                      }
                    </div>
                    <span class="text-gray-600 dark:text-gray-400">
                      {{ element.email }}
                    </span>
                  </div>
                </div>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="activated">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.activated' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.activated ? '✅' : '❌' }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <hlm-tooltip>
                  <a
                    [routerLink]="element.id + '/edit'"
                    hlmTooltipTrigger
                    hlmBtn
                    variant="ghost"
                    size="icon"
                    stopPropagation>
                    <ng-icon hlm size="sm" name="bootstrapGear" />
                  </a>
                  <span *brnTooltipContent>{{ 'general.edit' | transloco }}</span>
                </hlm-tooltip>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="usersStore.columnsToDisplay()" hlm-header-row></tr>
            <tr
              *hlmRowDef="let row; columns: usersStore.columnsToDisplay()"
              [routerLink]="row.id + '/edit'"
              hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="usersStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="usersStore.size()"
        [pageIndex]="usersStore.page()"
        [length]="usersStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  selector: 'pu-user-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableLoadingBar,
    RouterLink,
    StopPropagationDirective,
    TranslocoPipe,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmPaginatorImports,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmButtonImports,
    HlmIconImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
    InitialsPipe,
  ],
})
export class UserTable {
  readonly usersStore = inject(UsersStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.usersStore.setHlmPaginator(this.paginator);
    this.usersStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}
