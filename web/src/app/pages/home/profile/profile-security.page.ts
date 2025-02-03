import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {BiComponent} from 'dfx-bootstrap-icons';

import {TableLoadingBar} from '@app/components';
import {ProfilePasswordEditForm} from '@app/components/profile/profile-password-edit-form';
import {ProfileEditStore, SessionsStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-10">
      <div class="grid grid-cols-3">
        <div>
          <mat-card appearance="outlined">
            <mat-card-content>
              <pu-profile-password-form (submitCreate)="profileEditStore.updatePassword($event)" />
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <div>
        <h2 class="text-xl">Sessions</h2>

        <table
          [dataSource]="sessionsStore.entities()"
          [matSortActive]="sessionsStore.sortBy()"
          [matSortDirection]="sessionsStore.sortDirection()"
          mat-table
          matSort>
          <ng-container matColumnDef="description">
            <th *matHeaderCellDef mat-header-cell>Description</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.description }}
            </td>
          </ng-container>

          <ng-container matColumnDef="updatedAt">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Last used</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.updatedAt | date: 'YYYY.MM.dd HH:mm:ss' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th *matHeaderCellDef mat-header-cell mat-sort-header>Created at</th>
            <td *matCellDef="let element" mat-cell>
              {{ element.createdAt | date: 'YYYY.MM.dd HH:mm:ss' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th *matHeaderCellDef mat-header-cell></th>
            <td *matCellDef="let element" mat-cell>
              <button
                (click)="sessionsStore.delete(element.id)"
                mat-icon-button
                type="button"
                matTooltip="Delete">
                <bi name="trash" />
              </button>
            </td>
          </ng-container>

          <tr *matHeaderRowDef="sessionsStore.columnsToDisplay()" mat-header-row></tr>
          <tr *matRowDef="let row; columns: sessionsStore.columnsToDisplay()" mat-row></tr>
        </table>

        <pu-table-loading-bar [loading]="sessionsStore.isPending()" />

        @if (sessionsStore.isEmpty()) {
          <div class="mt-2 w-full text-center">No data available.</div>
        }

        <mat-paginator
          [pageSizeOptions]="[10, 20, 50, 100, 200]"
          [pageSize]="sessionsStore.size()"
          [pageIndex]="sessionsStore.page()"
          [length]="sessionsStore.totalElements()"
          showFirstLastButtons />
      </div>
    </div>
  `,
  selector: 'pu-profile-security-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionsStore, ProfileEditStore],
  imports: [
    BiComponent,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    TableLoadingBar,
    MatIconButton,
    MatTooltip,
    DatePipe,
    MatCard,
    MatCardContent,
    ProfilePasswordEditForm,
  ],
})
export class ProfileSecurityPage {
  readonly profileEditStore = inject(ProfileEditStore);
  readonly sessionsStore = inject(SessionsStore);

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.sessionsStore.setPaginator(this.paginator);
    this.sessionsStore.setSort(this.sort);

    this.sessionsStore.load(
      computed(() => ({
        userId: undefined,
        ...this.sessionsStore.pageable(),
      })),
    );
  }
}
