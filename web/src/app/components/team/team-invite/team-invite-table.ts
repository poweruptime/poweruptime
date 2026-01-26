import {ChangeDetectionStrategy, Component, inject, viewChild} from '@angular/core';

import {HlmPaginator, HlmPaginatorImports} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {DfxLowerCaseExceptFirstLettersPipe} from 'dfx-helper';

import {BackendType} from '@app/api';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {TeamInvitesStore} from '@app/services';

import {TableLoadingBar} from '../../table-loading-bar';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="teamInvitesStore.entities()"
            [hlmSortActive]="teamInvitesStore.sortBy()"
            [hlmSortDirection]="teamInvitesStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <ng-container hlmColumnDef="inviteeEmail">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.emailAddress' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.inviteeEmail }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="role">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.role' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.role | s_lowerCaseAllExceptFirstLetter }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="inviter.name">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'team.settings.invitedBy' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                {{ element.inviter.name }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="createdAt">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'team.settings.invitedAt' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <pu-relative-time [value]="element.createdAt" format="yyyy.MM.dd HH:mm:ss" />
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="teamInvitesStore.columnsToDisplay()" hlm-header-row></tr>
            <tr *hlmRowDef="let row; columns: teamInvitesStore.columnsToDisplay()" hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="teamInvitesStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="teamInvitesStore.size()"
        [pageIndex]="teamInvitesStore.page()"
        [length]="teamInvitesStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .hlm-column-role {
      @apply w-32;
    }

    .hlm-column-inviteeEmail {
      @apply w-64;
    }

    .hlm-column-inviter-name {
      @apply w-64;
    }
  `,
  selector: 'pu-team-invite-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    HlmDataTableImports,
    HlmSortImports,
    HlmPaginatorImports,
    HlmTableContainer,
    DfxLowerCaseExceptFirstLettersPipe,
  ],
})
export class TeamInviteTable {
  readonly teamInvitesStore = inject(TeamInvitesStore);

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.teamInvitesStore.setHlmPaginator(this.paginator);
    this.teamInvitesStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = (_: number, it: BackendType['TeamJoinTokenResponse']) =>
    `${it.inviter.id}-${it.inviteeEmail}-${new Date(it.createdAt).getTime().toString()}`;
}
