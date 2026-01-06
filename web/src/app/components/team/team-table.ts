import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatButton, MatIconButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatPrefix} from '@angular/material/form-field';
import {MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {MatPaginator} from '@angular/material/paginator';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {TableLoadingBar} from '@app/components';
import {TeamsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="table-responsive">
      <table
        [dataSource]="teamsStore.entities()"
        [matSortActive]="teamsStore.sortBy()"
        [matSortDirection]="teamsStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <!-- Checkbox Column -->
        <ng-container matColumnDef="select">
          <th *matHeaderCellDef mat-header-cell>
            <mat-checkbox
              [checked]="teamsStore.hasValue() && teamsStore.isAllSelected()"
              [indeterminate]="teamsStore.hasValue() && !teamsStore.isAllSelected()"
              (change)="$event ? teamsStore.toggleAll() : null"></mat-checkbox>
          </th>
          <td *matCellDef="let row" mat-cell>
            <mat-checkbox
              [checked]="teamsStore.isSelected(row)"
              (click)="$event.stopPropagation()"
              (change)="$event ? teamsStore.toggle(row) : null"></mat-checkbox>
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

        <ng-container matColumnDef="personalUser.id">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.personal' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.personal ? '✅' : '❌' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="monitorCount">
          <th *matHeaderCellDef mat-header-cell>{{ 'general.monitors' | transloco }}</th>
          <td *matCellDef="let element" mat-cell>
            {{ element.dashboard.monitorCount }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th *matHeaderCellDef mat-header-cell></th>
          <td *matCellDef="let element" mat-cell>
            @if (!_deleted) {
              <a
                [routerLink]="'/t/' + element.id + '/edit'"
                mat-icon-button
                matTooltip="Edit"
                stopPropagation>
                <ng-icon name="bootstrapGear" />
              </a>
              @if (!element.personal) {
                <button
                  (click)="teamsStore.delete(element.id)"
                  mat-icon-button
                  type="button"
                  matTooltip="Delete"
                  stopPropagation>
                  <ng-icon name="bootstrapTrash" />
                </button>
              }
            }
          </td>
        </ng-container>

        <tr *matHeaderRowDef="teamsStore.columnsToDisplay()" mat-header-row></tr>
        <tr
          *matRowDef="let row; columns: teamsStore.columnsToDisplay()"
          [routerLink]="'/t/' + row.id + '/edit'"
          mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="teamsStore.isPending()" />

    @if (teamsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="teamsStore.size()"
      [pageIndex]="teamsStore.page()"
      [length]="teamsStore.totalElements()"
      showFirstLastButtons />
  `,
  styles: `
    @reference "#styles.css";

    .mat-column-name {
      @apply w-80;
    }
    .mat-column-personalUser-id {
      @apply w-32;
    }
  `,
  selector: 'pu-instance-settings-teams-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TeamsStore],
  imports: [
    NgIcon,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    TableLoadingBar,
    MatIconButton,
    MatTooltip,
    RouterLink,
    StopPropagationDirective,
    TranslocoPipe,
    MatButton,
    FormsModule,
    MatSlideToggle,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatSuffix,
    MatFormField,
    MatLabel,
    MatCheckbox,
  ],
})
export class InstanceSettingsTeamsPage {
  readonly teamsStore = inject(TeamsStore);

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  searchFilter = linkedQueryParam('name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  deletedFilter = linkedQueryParam('deleted', {
    parse: paramToBoolean(),
  });

  constructor() {
    this.teamsStore.setPaginator(this.paginator);
    this.teamsStore.setSort(this.sort);

    this.teamsStore.setName(this.searchFilter);
    this.teamsStore.setDeleted(this.deletedFilter);

    this.teamsStore.load(
      computed(() => ({
        name: this.teamsStore.name(),
        deleted: this.teamsStore.deleted(),
        ...this.teamsStore.pageable(),
      })),
    );

    effect(() => {
      if (this.teamsStore.deleted()) {
        this.teamsStore.setColumnsToDisplay([
          'select',
          'name',
          'personalUser.id',
          'monitorCount',
          'actions',
        ]);
      } else {
        this.teamsStore.setColumnsToDisplay(['name', 'personalUser.id', 'monitorCount', 'actions']);
      }
    });
  }

  protected readonly trackBy = trackBy;
}
