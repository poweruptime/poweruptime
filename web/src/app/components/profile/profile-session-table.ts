import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmCheckbox} from '@spartan-ng/helm/checkbox';
import {HlmDataTableImports} from '@spartan-ng/helm/data-table';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmPaginator, HlmPaginatorImports} from '@spartan-ng/helm/paginator';
import {HlmSort, HlmSortImports} from '@spartan-ng/helm/sort';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {SessionsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <section hlmCard>
      <div class="items-center" hlmCardHeader>
        <h3 hlmCardTitle>{{ 'general.sessions' | transloco }}</h3>

        <div hlmCardAction>
          <button
            [disabled]="!sessionsStore.hasValue()"
            (click)="sessionsStore.deleteSelection()"
            type="button"
            variant="secondary"
            hlmBtn>
            <ng-icon hlm size="sm" name="bootstrapTrashFill" />
            {{ 'general.deleteSelection' | transloco }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-2" hlmCardContent>
        <div class="overflow-hidden">
          <div hlmTableContainer>
            <table
              [dataSource]="sessionsStore.entities()"
              [hlmSortActive]="sessionsStore.sortBy()"
              [hlmSortDirection]="sessionsStore.sortDirection()"
              [trackBy]="trackBy"
              hlm-data-table
              hlmSort>
              <!-- Checkbox Column -->
              <ng-container hlmColumnDef="select">
                <th *hlmHeaderCellDef hlm-header-cell>
                  <hlm-checkbox
                    [checked]="sessionsStore.isAllSelected()"
                    [indeterminate]="sessionsStore.hasValue() && !sessionsStore.isAllSelected()"
                    (checkedChange)="sessionsStore.toggleAll()" />
                </th>
                <td *hlmCellDef="let row" hlm-cell>
                  <hlm-checkbox
                    [checked]="sessionsStore.isSelected(row)"
                    (checkedChange)="sessionsStore.toggle(row)"
                    stopPropagation />
                </td>
              </ng-container>
              <ng-container hlmColumnDef="description">
                <th *hlmHeaderCellDef hlm-header-cell>{{ 'general.description' | transloco }}</th>
                <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                  {{ element.description }}
                </td>
              </ng-container>

              <ng-container hlmColumnDef="updatedAt">
                <th class="whitespace-nowrap" *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                  {{ 'profile.sessions.lastUsed' | transloco }}
                </th>
                <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                  {{ element.updatedAt | date: 'HH:mm yyyy.MM.dd' }}
                </td>
              </ng-container>

              <ng-container hlmColumnDef="createdAt">
                <th class="whitespace-nowrap" *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                  {{ 'general.createdAt' | transloco }}
                </th>
                <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                  {{ element.createdAt | date: 'HH:mm yyyy.MM.dd' }}
                </td>
              </ng-container>

              <tr *hlmHeaderRowDef="sessionsStore.columnsToDisplay()" hlm-header-row></tr>
              <tr *hlmRowDef="let row; columns: sessionsStore.columnsToDisplay()" hlm-row></tr>
            </table>
          </div>
        </div>

        <pu-table-loading-bar [loading]="sessionsStore.isPending()" />

        <hlm-paginator
          [pageSizeOptions]="[10, 20, 50, 100, 200]"
          [pageSize]="sessionsStore.size()"
          [pageIndex]="sessionsStore.page()"
          [length]="sessionsStore.totalElements()"
          showFirstLastButtons />
      </div>
    </section>
  `,
  selector: 'pu-profile-session-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionsStore],
  imports: [
    TableLoadingBar,
    DatePipe,
    TranslocoPipe,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmPaginatorImports,
    HlmCheckbox,
    StopPropagationDirective,
    HlmButtonImports,
    HlmIconImports,
    HlmCardImports,
  ],
})
export class ProfileSessionTable {
  protected readonly trackBy = trackBy;

  protected readonly sessionsStore = inject(SessionsStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.sessionsStore.setHlmPaginator(this.paginator);
    this.sessionsStore.setHlmSort(this.sort);

    this.sessionsStore.load(
      computed(() => ({
        userId: undefined,
        ...this.sessionsStore.pageable(),
      })),
    );
  }
}
