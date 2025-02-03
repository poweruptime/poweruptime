import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatAnchor, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {RouterLink} from '@angular/router';

import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {SelectedTeamStore, StatusPageEditStore, StatusPagesStore} from '@app/services';

@Component({
  template: `
    <a mat-flat-button routerLink="new">New status page</a>

    <table
      [dataSource]="statusPagesStore.entities()"
      [matSortActive]="statusPagesStore.sortBy()"
      [matSortDirection]="statusPagesStore.sortDirection()"
      mat-table
      matSort>
      <ng-container matColumnDef="name">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>Name</th>
        <td *matCellDef="let element" mat-cell>{{ element.name }}</td>
      </ng-container>

      <ng-container matColumnDef="slug">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>Slug</th>
        <td *matCellDef="let element" mat-cell>{{ element.slug }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th *matHeaderCellDef mat-header-cell></th>
        <td *matCellDef="let element" mat-cell>
          <a
            [href]="'/public/s/' + element.slug"
            target="_blank"
            mat-icon-button
            stopPropagation
            aria-label="Preview status page">
            <bi name="eye" />
          </a>
          <button
            [routerLink]="element.id"
            mat-icon-button
            stopPropagation
            aria-label="Edit the status page">
            <bi name="pencil-square" />
          </button>
          <button
            (click)="statusPageEditStore.delete(element.id)"
            mat-icon-button
            stopPropagation
            aria-label="Delete the notification method">
            <bi name="trash-fill" />
          </button>
        </td>
      </ng-container>

      <tr *matHeaderRowDef="statusPagesStore.columnsToDisplay()" mat-header-row></tr>
      <tr
        class="hover:cursor-pointer"
        *matRowDef="let element; columns: statusPagesStore.columnsToDisplay()"
        [routerLink]="element.id"
        mat-row></tr>
    </table>

    <pu-table-loading-bar [loading]="statusPagesStore.isPending()" />

    @if (statusPagesStore.isEmpty()) {
      <div class="mt-2 w-full text-center">No data available.</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="statusPagesStore.size()"
      [pageIndex]="statusPagesStore.page()"
      [length]="statusPagesStore.totalElements()"
      showFirstLastButtons />
  `,
  selector: 'pu-status-pages-page',
  providers: [StatusPageEditStore],
  imports: [
    MatAnchor,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    StopPropagationDirective,
    TableLoadingBar,
    MatIconButton,
    BiComponent,
    MatIconAnchor,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPagesPage {
  readonly statusPagesStore = inject(StatusPagesStore);
  readonly statusPageEditStore = inject(StatusPageEditStore);

  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  constructor() {
    this.statusPagesStore.setPaginator(this.paginator);
    this.statusPagesStore.setSort(this.sort);

    const teamId = inject(SelectedTeamStore).selectedTeamId;

    this.statusPagesStore.load(
      computed(() => ({
        teamId: teamId(),
        search: this.statusPagesStore.search(),
        ...this.statusPagesStore.pageable(),
      })),
    );
  }
}
