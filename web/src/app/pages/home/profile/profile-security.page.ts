import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {TableLoadingBar} from '@app/components';
import {ProfileMFAForm, ProfilePasswordEditForm} from '@app/components/profile';
import {ProfileEditStore, SessionsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="flex flex-col gap-10">
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ 'profile.password.update' | transloco }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="mt-4">
                <pu-profile-password-form
                  (submitCreate)="profileEditStore.updatePassword($event)" />
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        <div>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ 'profile.mfa.title' | transloco }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="mt-4">
                <pu-profile-mfa-form />
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <hr />

      <div>
        <h2 class="text-xl">{{ 'general.sessions' | transloco }}</h2>

        <div class="table-responsive">
          <table
            [dataSource]="sessionsStore.entities()"
            [matSortActive]="sessionsStore.sortBy()"
            [matSortDirection]="sessionsStore.sortDirection()"
            [trackBy]="trackBy"
            mat-table
            matSort>
            <ng-container matColumnDef="description">
              <th *matHeaderCellDef mat-header-cell>{{ 'general.description' | transloco }}</th>
              <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
                {{ element.description }}
              </td>
            </ng-container>

            <ng-container matColumnDef="updatedAt">
              <th class="whitespace-nowrap" *matHeaderCellDef mat-header-cell mat-sort-header>
                {{ 'profile.sessions.lastUsed' | transloco }}
              </th>
              <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
                {{ element.updatedAt | date: 'YYYY.MM.dd HH:mm:ss' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th class="whitespace-nowrap" *matHeaderCellDef mat-header-cell mat-sort-header>
                {{ 'general.createdAt' | transloco }}
              </th>
              <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
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
        </div>

        <pu-table-loading-bar [loading]="sessionsStore.isPending()" />

        @if (sessionsStore.isEmpty()) {
          <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
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
    MatCardHeader,
    MatCardTitle,
    TranslocoPipe,
    ProfileMFAForm,
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

  protected readonly trackBy = trackBy;
}
