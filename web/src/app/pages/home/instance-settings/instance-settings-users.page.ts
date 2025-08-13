import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatButton, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatChip} from '@angular/material/chips';
import {MatPrefix} from '@angular/material/form-field';
import {MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {MatPaginator} from '@angular/material/paginator';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {TableLoadingBar} from '@app/components';
import {UsersStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="flex flex-col items-end justify-between gap-2 pt-1 md:flex-row md:items-center">
      <a mat-flat-button routerLink="new">{{ 'instanceSettings.inviteUser' | transloco }}</a>

      <div class="flex flex-col items-end gap-2 md:flex-row md:items-center">
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

        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'general.role' | transloco }}</mat-label>
          <mat-select [(ngModel)]="roleFilter">
            @for (role of roles; track role.value) {
              <mat-option [value]="role.value">
                {{ role.name }}
              </mat-option>
            }
          </mat-select>

          @if ((roleFilter()?.length ?? 0) > 0) {
            <button
              class="flex items-center"
              [attr.aria-label]="'general.clear' | transloco"
              (click)="roleFilter.set('')"
              type="button"
              matSuffix
              mat-icon-button>
              <bi name="x-lg" aria-hidden="true" />
            </button>
          }
        </mat-form-field>

        @let _activated = activatedFilter();
        <mat-slide-toggle
          [checked]="_activated ?? false"
          (toggleChange)="activatedFilter.set(_activated ? null : true)"
          labelPosition="before">
          {{ 'general.activated' | transloco }}
        </mat-slide-toggle>
      </div>
    </div>

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
            <mat-chip>
              @if (element.role === 'ADMIN') {
                <bi name="star-fill" />
              }
              {{ element.role }}
            </mat-chip>
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
    TranslocoPipe,
    MatButton,
    FormsModule,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatSuffix,
    MatIconButton,
    MatSlideToggle,
    MatOption,
    MatSelect,
  ],
})
export class InstanceSettingsUsersPage {
  readonly usersStore = inject(UsersStore);

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  searchFilter = linkedQueryParam('search', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  roleFilter = linkedQueryParam<BackendType['UserResponse']['role'] | ''>('role', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  activatedFilter = linkedQueryParam('activated', {
    parse: paramToBoolean(),
  });

  constructor() {
    this.usersStore.setPaginator(this.paginator);
    this.usersStore.setSort(this.sort);

    this.usersStore.setSearch(this.searchFilter);
    this.usersStore.setRole(this.roleFilter as Signal<BackendType['UserResponse']['role']>);
    this.usersStore.setActivated(this.activatedFilter);

    this.usersStore.load(
      computed(() => ({
        search: this.usersStore.search(),
        activated: this.usersStore.activated(),
        role: this.usersStore.role(),
        ...this.usersStore.pageable(),
      })),
    );
  }

  readonly roles = [
    {value: 'USER' as const, name: 'User'},
    {value: 'ADMIN' as const, name: 'Admin'},
  ];

  protected readonly trackBy = trackBy;
}
