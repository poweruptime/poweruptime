import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatAnchor, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatPrefix, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatPaginator} from '@angular/material/paginator';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxImplodePipe, StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {TableLoadingBar} from '@app/components';
import {IsTeamAdmin} from '@app/directives';
import {BooleanEmojiPipe, NotificationSenderDataValueLabelPipe} from '@app/pipes';
import {NotificationMethodsStore, SelectedTeamStore} from '@app/services';
import {arrayToParam, paramToArray, trackBy} from '@app/util';

@Component({
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
      <a *isTeamAdmin mat-flat-button routerLink="new">
        {{ 'cmdk.groups.notificationMethod.create' | transloco }}
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
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'general.type' | transloco }}</mat-label>
          <mat-select [(ngModel)]="typesFilter" multiple>
            @for (type of types; track type.value) {
              <mat-option [value]="type.value">
                {{ type.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        @let _useByDefault = useByDefaultFilter();
        <mat-slide-toggle
          [checked]="_useByDefault ?? false"
          (toggleChange)="useByDefaultFilter.set(_useByDefault ? null : true)"
          labelPosition="before">
          {{ 'notificationMethod.edit.useByDefault' | transloco }}
        </mat-slide-toggle>
      </div>
    </div>

    <div class="table-responsive">
      <table
        [dataSource]="notificationMethodsStore.entities()"
        [matSortActive]="notificationMethodsStore.sortBy()"
        [matSortDirection]="notificationMethodsStore.sortDirection()"
        [trackBy]="trackBy"
        mat-table
        matSort>
        <ng-container matColumnDef="name">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.name' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>{{ element.name }}</td>
        </ng-container>

        <ng-container matColumnDef="sender._type">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'general.type' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>
            {{ element.sender._type | notificationSenderDataValueLabel | transloco }}
          </td>
        </ng-container>

        <ng-container matColumnDef="sender">
          <th *matHeaderCellDef mat-header-cell></th>
          <td *matCellDef="let element" mat-cell>
            @switch (element.sender._type) {
              @case ('EMAIL') {
                <div class="inline-flex items-center gap-1">
                  <span>{{ 'notificationMethod.list.email.recipient' | transloco }}</span>
                  <a
                    class="font-extrabold underline"
                    [href]="'mailto:' + $any(element.sender)['to']"
                    stopPropagation
                    target="_blank"
                    rel="noopener noreferrer">
                    {{ $any(element.sender)['to'] | s_implode: ', ' : 40 : '...' }}
                  </a>
                  <span>{{ 'notificationMethod.list.email.via' | transloco }}</span>
                  <a
                    class="font-extrabold underline"
                    [href]="'https://' + $any(element.sender)['host']"
                    stopPropagation
                    target="_blank"
                    rel="noopener noreferrer">
                    {{ $any(element.sender)['host'] }}
                  </a>
                </div>
              }
            }
          </td>
        </ng-container>

        <ng-container matColumnDef="useByDefault">
          <th *matHeaderCellDef mat-header-cell mat-sort-header>
            {{ 'notificationMethod.edit.useByDefault' | transloco }}
          </th>
          <td *matCellDef="let element" mat-cell>{{ element.useByDefault | booleanEmoji }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th *matHeaderCellDef mat-header-cell></th>
          <td *matCellDef="let element" mat-cell>
            <div class="flex gap-2" *isTeamAdmin>
              <a
                [routerLink]="element.id"
                [matTooltip]="'notificationMethod.list.edit' | transloco"
                [attr.aria-label]="'notificationMethod.list.edit' | transloco"
                mat-icon-button
                stopPropagation>
                <bi name="pencil-square" />
              </a>
              <button
                [matTooltip]="'notificationMethod.list.delete' | transloco"
                [attr.aria-label]="'notificationMethod.list.delete' | transloco"
                (click)="notificationMethodsStore.delete(element.id)"
                type="button"
                mat-icon-button
                stopPropagation>
                <bi name="trash-fill" />
              </button>
            </div>
          </td>
        </ng-container>

        <tr *matHeaderRowDef="notificationMethodsStore.columnsToDisplay()" mat-header-row></tr>
        <tr
          class="hover:cursor-pointer"
          *matRowDef="let element; columns: notificationMethodsStore.columnsToDisplay()"
          [routerLink]="element.id"
          mat-row></tr>
      </table>
    </div>

    <pu-table-loading-bar [loading]="notificationMethodsStore.isPending()" />

    @if (notificationMethodsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="notificationMethodsStore.size()"
      [pageIndex]="notificationMethodsStore.page()"
      [length]="notificationMethodsStore.totalElements()"
      showFirstLastButtons />
  `,
  styles: `
    @reference "#styles.css";

    .mat-column-name {
      @apply w-52 text-nowrap;
    }
    .mat-column-sender-_type {
      @apply w-20;
    }
    .mat-column-useByDefault {
      @apply w-36;
    }
    .mat-column-actions {
      @apply w-10;
    }
  `,
  selector: 'pu-notification-methods-page',
  imports: [
    FormsModule,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatPaginator,
    MatAnchor,
    MatIconButton,
    MatPrefix,
    MatSuffix,
    MatLabel,
    MatOption,
    MatSelect,
    MatInput,
    MatTooltip,
    MatIconAnchor,
    MatFormField,
    MatSlideToggle,
    StopPropagationDirective,
    BiComponent,
    DfxImplodePipe,
    TranslocoPipe,
    IsTeamAdmin,
    TableLoadingBar,
    BooleanEmojiPipe,
    NotificationSenderDataValueLabelPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodsPage {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  searchFilter = linkedQueryParam('name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  typesFilter = linkedQueryParam('type', {
    parse: paramToArray<BackendType['NotificationMethodResponse']['sender']['_type']>(),
    stringify: arrayToParam(),
  });
  useByDefaultFilter = linkedQueryParam('useByDefault', {
    parse: paramToBoolean(),
  });

  constructor() {
    this.notificationMethodsStore.setPaginator(this.paginator);
    this.notificationMethodsStore.setSort(this.sort);

    this.notificationMethodsStore.setSearch(this.searchFilter);
    this.notificationMethodsStore.setTypes(this.typesFilter);
    this.notificationMethodsStore.setUseByDefault(this.useByDefaultFilter);

    const teamId = inject(SelectedTeamStore).selectedTeamId;

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: teamId(),
        search: this.notificationMethodsStore.search(),
        types: this.notificationMethodsStore.types(),
        useByDefault: this.notificationMethodsStore.useByDefault(),
        ...this.notificationMethodsStore.pageable(),
      })),
    );
  }

  readonly types = [
    {value: 'DISCORD' as const, name: 'Discord'},
    {value: 'EMAIL' as const, name: 'Email'},
    {value: 'SLACK' as const, name: 'Slack'},
  ];

  protected readonly trackBy = trackBy;
}
