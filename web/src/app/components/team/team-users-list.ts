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
import {TeamUsersStore} from '@app/services';

@Component({
  template: `
    @let _teamId = teamId();
    <mat-card appearance="outlined">
      <mat-card-content>
        <table
          [dataSource]="teamUsersStore.entities()"
          [matSortActive]="teamUsersStore.sortBy()"
          [matSortDirection]="teamUsersStore.sortDirection()"
          mat-table
          matSort>
          <ng-container matColumnDef="id.user.name">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Name</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.user.name }}
            </td>
          </ng-container>

          <ng-container matColumnDef="role">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Role</th>
            <td *matCellDef="let element" mat-cell>
              <mat-chip>{{ element.role }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="invitedBy.name">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Invited By</th>
            <td *matCellDef="let element" mat-cell>
              @if (element.invitedBy; as invitedBy) {
                {{ invitedBy.name }}
              } @else {
                <mat-chip>System</mat-chip>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Created at</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.invitedAt | date: 'YYYY.MM.dd HH:mm:ss' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th *matHeaderCellDef mat-header-cell></th>
            <td *matCellDef="let element" mat-cell>
              @if (_teamId; as _teamId) {
                <button
                  (click)="teamUsersStore.remove({teamId: _teamId, userId: element.user.id})"
                  mat-icon-button
                  type="button"
                  matTooltip="Remove from team">
                  <bi name="trash" />
                </button>
              }
            </td>
          </ng-container>

          <tr *matHeaderRowDef="teamUsersStore.columnsToDisplay()" mat-header-row></tr>
          <tr *matRowDef="let row; columns: teamUsersStore.columnsToDisplay()" mat-row></tr>
        </table>

        <pu-table-loading-bar [loading]="teamUsersStore.isPending()" />

        @if (teamUsersStore.isEmpty()) {
          <div class="mt-2 w-full text-center">No data available.</div>
        }

        <mat-paginator
          [pageSizeOptions]="[10, 20, 50, 100, 200]"
          [pageSize]="teamUsersStore.size()"
          [pageIndex]="teamUsersStore.page()"
          [length]="teamUsersStore.totalElements()"
          showFirstLastButtons />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .mat-column-role {
      @apply w-32;
    }

    .mat-column-id-user-name {
      @apply w-80;
    }

    .mat-column-invitedBy-name {
      @apply w-80;
    }

    .mat-column-createdAt {
      @apply w-24;
    }

    .mat-column-actions {
      @apply w-16;
    }
  `,
  selector: 'pu-team-users-list',
  providers: [TeamUsersStore],
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
    MatIconButton,
    BiComponent,
    MatTooltip,
  ],
})
export class TeamUsersList {
  readonly teamUsersStore = inject(TeamUsersStore);

  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.teamUsersStore.setPaginator(this.paginator);
    this.teamUsersStore.setSort(this.sort);

    this.teamUsersStore.load(
      computed(() => ({
        teamId: this.teamId(),
        ...this.teamUsersStore.pageable(),
      })),
    );
  }
}
