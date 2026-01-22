import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCheckboxImports} from '@spartan-ng/helm/checkbox';
import {HlmDataTableImports} from '@spartan-ng/helm/data-table';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmPaginator, HlmPaginatorImports} from '@spartan-ng/helm/paginator';
import {HlmSort, HlmSortImports} from '@spartan-ng/helm/sort';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {TeamsStore} from '@app/services';
import {trackBy} from '@app/util';

import {Pattern} from '../../directives';

@Component({
  template: `
    @let _showDeleted = showDeleted();
    <div class="flex flex-col gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="teamsStore.entities()"
            [hlmSortActive]="teamsStore.sortBy()"
            [hlmSortDirection]="teamsStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <!-- Checkbox Column -->
            <ng-container hlmColumnDef="select">
              <th *hlmHeaderCellDef hlm-header-cell>
                <hlm-checkbox
                  [checked]="teamsStore.isAllSelected()"
                  [indeterminate]="teamsStore.hasValue() && !teamsStore.isAllSelected()"
                  (checkedChange)="teamsStore.toggleAll()" />
              </th>
              <td *hlmCellDef="let row" hlm-cell>
                <hlm-checkbox
                  [checked]="teamsStore.isSelected(row)"
                  (checkedChange)="teamsStore.toggle(row)"
                  stopPropagation />
              </td>
            </ng-container>
            <ng-container hlmColumnDef="name">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.name' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <div class="flex items-center gap-2">
                  <div class="aspect-square size-8 rounded-lg" [pu-pattern]="element.id"></div>
                  <span>{{ element.name }}</span>
                </div>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="personalUser.id">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.personal' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.personal ? '✅' : '❌' }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="monitorCount">
              <th *hlmHeaderCellDef hlm-header-cell>{{ 'general.monitors' | transloco }}</th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.dashboard.monitorCount }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <div class="flex gap-2">
                  <hlm-tooltip>
                    <a
                      [routerLink]="'/t/' + element.id + '/edit'"
                      hlmTooltipTrigger
                      hlmBtn
                      size="icon"
                      variant="ghost"
                      stopPropagation>
                      <ng-icon hlm size="sm" name="bootstrapGear" />
                    </a>
                    <span *brnTooltipContent>{{ 'general.edit' | transloco }}</span>
                  </hlm-tooltip>
                  @if (!element.personal) {
                    <hlm-tooltip>
                      <button
                        (click)="teamsStore.delete(element.id)"
                        hlmTooltipTrigger
                        hlmBtn
                        size="icon"
                        variant="secondary"
                        type="button"
                        stopPropagation>
                        <ng-icon hlm size="sm" name="bootstrapTrash" />
                      </button>
                      <span *brnTooltipContent>{{ 'general.delete' | transloco }}</span>
                    </hlm-tooltip>
                  }
                </div>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="teamsStore.columnsToDisplay()" hlm-header-row></tr>
            @if (_showDeleted) {
              <tr *hlmRowDef="let row; columns: teamsStore.columnsToDisplay()" hlm-row></tr>
            } @else {
              <tr
                *hlmRowDef="let row; columns: teamsStore.columnsToDisplay()"
                [routerLink]="'/t/' + row.id + '/edit'"
                hlm-row></tr>
            }
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="teamsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="teamsStore.size()"
        [pageIndex]="teamsStore.page()"
        [length]="teamsStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .hlm-column-name {
      @apply w-80;
    }
    .hlm-column-personalUser-id {
      @apply w-32;
    }
  `,
  selector: 'pu-team-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableLoadingBar,
    RouterLink,
    StopPropagationDirective,
    TranslocoPipe,
    HlmPaginatorImports,
    HlmSortImports,
    HlmDataTableImports,
    HlmIconImports,
    HlmButtonImports,
    HlmTooltipImports,
    HlmCheckboxImports,
    HlmTableContainer,
    BrnTooltipContentTemplate,
    Pattern,
  ],
})
export class TeamTable {
  protected readonly teamsStore = inject(TeamsStore);

  showDeleted = input(false, {transform: booleanAttribute});

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.teamsStore.setHlmPaginator(this.paginator);
    this.teamsStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}
