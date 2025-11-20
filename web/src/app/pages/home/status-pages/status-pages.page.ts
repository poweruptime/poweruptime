import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatButton, MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatPrefix, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {TableLoadingBar} from '@app/components';
import {IsTeamAdmin} from '@app/directives';
import {SelectedTeamStore, StatusPagesStore} from '@app/services';

import {BackendType} from '../../../api';

@Component({
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
      <a *isTeamAdmin mat-flat-button routerLink="new">
        {{ 'cmdk.groups.statusPage.create' | transloco }}
      </a>

      <div class="flex flex-wrap items-center gap-2">
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'general.search' | transloco }}</mat-label>
          <bi name="search" matIconPrefix />
          <input [(ngModel)]="searchFilter" matInput />
          @if ((searchFilter()?.length ?? 0) > 0) {
            <button
              class="flex items-center"
              [attr.aria-label]="'general.clear' | transloco"
              (click)="searchFilter.set('')"
              type="button"
              matSuffix
              mat-icon-button>
              <bi name="x-lg" aria-hidden="true" />
            </button>
          }
        </mat-form-field>
      </div>
    </div>

    <table
      [dataSource]="statusPagesStore.entities()"
      [matSortActive]="statusPagesStore.sortBy()"
      [matSortDirection]="statusPagesStore.sortDirection()"
      [trackBy]="trackBy"
      mat-table
      matSort>
      <ng-container matColumnDef="name">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>
          {{ 'general.name' | transloco }}
        </th>
        <td *matCellDef="let element" mat-cell>{{ element.name }}</td>
      </ng-container>

      <ng-container matColumnDef="slug">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>
          {{ 'general.slug' | transloco }}
        </th>
        <td *matCellDef="let element" mat-cell>{{ element.slug }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th *matHeaderCellDef mat-header-cell></th>
        <td *matCellDef="let element" mat-cell>
          <div class="flex gap-2" *isTeamAdmin>
            <a
              [routerLink]="element.slug"
              [matTooltip]="'statusPage.list.edit' | transloco"
              [attr.aria-label]="'statusPage.list.edit' | transloco"
              mat-icon-button
              stopPropagation>
              <bi name="pencil-square" />
            </a>
            <a
              [routerLink]="element.slug"
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
              (click)="statusPagesStore.delete(element.slug)"
              type="button"
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
        [routerLink]="element.slug"
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
    RouterLink,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    MatFormField,
    MatInput,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatIconButton,
    MatTooltip,
    StopPropagationDirective,
    BiComponent,
    TranslocoPipe,
    TableLoadingBar,
    IsTeamAdmin,
    MatButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPagesPage {
  readonly statusPagesStore = inject(StatusPagesStore);

  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  searchFilter = linkedQueryParam('name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });

  constructor() {
    this.statusPagesStore.setPaginator(this.paginator);
    this.statusPagesStore.setSort(this.sort);
    this.statusPagesStore.setSearch(this.searchFilter);

    const teamId = inject(SelectedTeamStore).selectedTeamId;

    this.statusPagesStore.load(
      computed(() => ({
        teamId: teamId(),
        search: this.statusPagesStore.search(),
        ...this.statusPagesStore.pageable(),
      })),
    );
  }

  protected readonly trackBy = (_: number, it: BackendType['StatusPageResponse']) => it.slug;
}
