import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {MatChip} from '@angular/material/chips';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';

import {TranslocoPipe} from '@jsverse/transloco';

import {TableLoadingBar} from '@app/components';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {TeamInvitesStore} from '@app/services';

import {BackendType} from '../../api';

@Component({
  template: `
    <table
      [dataSource]="teamInvitesStore.entities()"
      [matSortActive]="teamInvitesStore.sortBy()"
      [matSortDirection]="teamInvitesStore.sortDirection()"
      [trackBy]="trackBy"
      mat-table
      matSort>
      <ng-container matColumnDef="inviteeEmail">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>
          {{ 'general.emailAddress' | transloco }}
        </th>
        <td *matCellDef="let element" mat-cell>
          {{ element.inviteeEmail }}
        </td>
      </ng-container>

      <ng-container matColumnDef="role">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>
          {{ 'general.role' | transloco }}
        </th>
        <td *matCellDef="let element" mat-cell>
          <mat-chip>{{ element.role }}</mat-chip>
        </td>
      </ng-container>

      <ng-container matColumnDef="inviter.name">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>
          {{ 'team.settings.invitedBy' | transloco }}
        </th>
        <td *matCellDef="let element" mat-cell>
          {{ element.inviter.name }}
        </td>
      </ng-container>

      <ng-container matColumnDef="createdAt">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>
          {{ 'team.settings.invitedAt' | transloco }}
        </th>
        <td *matCellDef="let element" mat-cell>
          <pu-relative-time [value]="element.createdAt" format="yyyy.MM.dd HH:mm:ss" />
        </td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th *matHeaderCellDef mat-header-cell></th>
        <td *matCellDef="let element" mat-cell></td>
      </ng-container>

      <tr *matHeaderRowDef="teamInvitesStore.columnsToDisplay()" mat-header-row></tr>
      <tr *matRowDef="let row; columns: teamInvitesStore.columnsToDisplay()" mat-row></tr>
    </table>

    <pu-table-loading-bar [loading]="teamInvitesStore.isPending()" />

    @if (teamInvitesStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'team.settings.noInvites' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="teamInvitesStore.size()"
      [pageIndex]="teamInvitesStore.page()"
      [length]="teamInvitesStore.totalElements()"
      showFirstLastButtons />
  `,
  styles: `
    @reference "#styles.css";

    .mat-column-role {
      @apply w-32;
    }

    .mat-column-inviteeEmail {
      @apply w-64;
    }

    .mat-column-inviter-name {
      @apply w-64;
    }

    .mat-column-actions {
      @apply w-16;
    }
  `,
  selector: 'pu-team-invites-list',
  providers: [TeamInvitesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatPaginator,
    MatSortModule,
    TableLoadingBar,
    MatChip,
    TranslocoPipe,
    RelativeTimeWithTooltip,
  ],
})
export class TeamInvitesList {
  readonly teamInvitesStore = inject(TeamInvitesStore);

  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.teamInvitesStore.setPaginator(this.paginator);
    this.teamInvitesStore.setSort(this.sort);

    this.teamInvitesStore.load(
      computed(() => ({
        teamId: this.teamId(),
        ...this.teamInvitesStore.pageable(),
      })),
    );
  }

  protected readonly trackBy = (_: number, it: BackendType['TeamJoinTokenResponse']) =>
    `${it.inviter.id}-${it.inviteeEmail}-${new Date(it.createdAt).getTime().toString()}`;
}
