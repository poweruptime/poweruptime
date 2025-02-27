import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatChip} from '@angular/material/chips';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {BiComponent} from 'dfx-bootstrap-icons';

import {TableLoadingBar} from '@app/components';
import {TeamInvitesStore} from '@app/services';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-content>
        <table
          [dataSource]="teamInvitesStore.entities()"
          [matSortActive]="teamInvitesStore.sortBy()"
          [matSortDirection]="teamInvitesStore.sortDirection()"
          mat-table
          matSort>
          <ng-container matColumnDef="inviteeEmail">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>E-Mail</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.inviteeEmail }}
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Role</th>
            <td *matCellDef="let element" mat-cell>
              <mat-chip>{{ element.role }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="inviter.name">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Invited By</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.inviter.name }}
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>At</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.createdAt | date: 'YYYY.MM.dd HH:mm:ss' }}
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
          <div class="mt-2 w-full text-center">No data available.</div>
        }

        <mat-paginator
          [pageSizeOptions]="[10, 20, 50, 100, 200]"
          [pageSize]="teamInvitesStore.size()"
          [pageIndex]="teamInvitesStore.page()"
          [length]="teamInvitesStore.totalElements()"
          showFirstLastButtons />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .mat-column-role {
      @apply w-32;
    }

    .mat-column-inviteeEmail {
      @apply w-64;
    }

    .mat-column-inviter-name {
      @apply w-64;
    }

    .mat-column-createdAt {
      @apply w-48;
    }

    .mat-column-actions {
      @apply w-16;
    }
  `,
  selector: 'pu-team-invites-list',
  providers: [TeamInvitesStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCard,
    MatCardContent,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    TableLoadingBar,
    MatChip,
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
}
