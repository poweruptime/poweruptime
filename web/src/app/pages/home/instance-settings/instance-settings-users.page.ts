import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatAnchor, MatIconAnchor} from '@angular/material/button';
import {MatChip} from '@angular/material/chips';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {UsersStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <a mat-flat-button routerLink="new">{{ 'instanceSettings.inviteUser' | transloco }}</a>

    <div class="table-responsive">
      <table
        [dataSource]="usersStore.entities()"
        [matSortActive]="usersStore.sortBy()"
        [matSortDirection]="usersStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <ng-container matColumnDef="email">
          <th class="whitespace-nowrap" *matHeaderCellDef mat-header-cell>
            {{ 'general.emailAddress' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.email }}
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.name' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.name }}
          </td>
        </ng-container>

        <ng-container matColumnDef="activated">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.activated' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.activated ? '✅' : '❌' }}
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

        <ng-container matColumnDef="actions">
          <th *matHeaderCellDef mat-header-cell></th>
          <td *matCellDef="let element" mat-cell>
            <a
              [routerLink]="element.id + '/edit'"
              mat-icon-button
              matTooltip="Edit"
              stopPropagation>
              <bi name="gear" />
            </a>
          </td>
        </ng-container>

        <tr *matHeaderRowDef="usersStore.columnsToDisplay()" mat-header-row></tr>
        <tr
          *matRowDef="let row; columns: usersStore.columnsToDisplay()"
          [routerLink]="row.id + '/edit'"
          mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="usersStore.isPending()" />

    @if (usersStore.isEmpty()) {
      <div class="mt-2 w-full text-center">No data available.</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="usersStore.size()"
      [pageIndex]="usersStore.page()"
      [length]="usersStore.totalElements()"
      showFirstLastButtons />
  `,
  selector: 'pu-instance-settings-users-page',
  providers: [UsersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BiComponent,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    TableLoadingBar,
    MatTooltip,
    MatChip,
    RouterLink,
    StopPropagationDirective,
    MatIconAnchor,
    MatAnchor,
    TranslocoPipe,
  ],
})
export class InstanceSettingsUsersPage {
  readonly usersStore = inject(UsersStore);

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.usersStore.setPaginator(this.paginator);
    this.usersStore.setSort(this.sort);

    this.usersStore.load(
      computed(() => ({
        name: this.usersStore.name(),
        email: this.usersStore.email(),
        activated: this.usersStore.activated(),
        role: this.usersStore.role(),
        ...this.usersStore.pageable(),
      })),
    );
  }

  protected readonly trackBy = trackBy;
}
