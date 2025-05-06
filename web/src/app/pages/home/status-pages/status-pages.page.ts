import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatAnchor, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {SelectedTeamStore, StatusPagesStore} from '@app/services';
import {trackBy} from '@app/util';

import {IsTeamAdmin} from '../../../directives/is-team-admin';

@Component({
  template: `
    <a *isTeamAdmin mat-flat-button routerLink="new">
      {{ 'cmdk.groups.statusPage.create' | transloco }}
    </a>

    <table
      [dataSource]="statusPagesStore.entities()"
      [matSortActive]="statusPagesStore.sortBy()"
      [matSortDirection]="statusPagesStore.sortDirection()"
      [trackBy]="trackBy"
      mat-table
      matSort>
      <ng-container matColumnDef="name">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>{{ 'general.name' | transloco }}</th>
        <td *matCellDef="let element" mat-cell>{{ element.name }}</td>
      </ng-container>

      <ng-container matColumnDef="slug">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>{{ 'general.slug' | transloco }}</th>
        <td *matCellDef="let element" mat-cell>{{ element.slug }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th *matHeaderCellDef mat-header-cell></th>
        <td *matCellDef="let element" mat-cell>
          <div class="flex gap-2" *isTeamAdmin>
            <a
              [routerLink]="element.id"
              [matTooltip]="'statusPage.list.edit' | transloco"
              [attr.aria-label]="'statusPage.list.edit' | transloco"
              mat-icon-button
              stopPropagation>
              <bi name="pencil-square" />
            </a>
            <a
              [routerLink]="element.id"
              [queryParams]="{preview: 1}"
              [matTooltip]="'statusPage.list.preview' | transloco"
              [attr.aria-label]="'statusPage.list.preview' | transloco"
              mat-icon-button
              stopPropagation>
              <bi name="eye" />
            </a>
            <a [href]="'/public/s/' + element.slug" target="_blank" mat-icon-button stopPropagation>
              <bi name="box-arrow-up-right" />
            </a>
            <button
              [matTooltip]="'statusPage.list.delete' | transloco"
              [attr.aria-label]="'statusPage.list.delete' | transloco"
              (click)="statusPagesStore.delete(element.id)"
              mat-icon-button
              stopPropagation>
              <bi name="trash-fill" />
            </button>
          </div>
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
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="statusPagesStore.size()"
      [pageIndex]="statusPagesStore.page()"
      [length]="statusPagesStore.totalElements()"
      showFirstLastButtons />
  `,
  selector: 'pu-status-pages-page',
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
    TranslocoPipe,
    MatTooltip,
    IsTeamAdmin,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPagesPage {
  readonly statusPagesStore = inject(StatusPagesStore);

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

  protected readonly trackBy = trackBy;
}
