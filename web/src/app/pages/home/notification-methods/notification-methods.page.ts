import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatAnchor, MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatPaginator} from '@angular/material/paginator';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxImplodePipe, StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {TableLoadingBar} from '@app/components';
import {IsTeamAdmin} from '@app/directives';
import {NotificationSenderDataValueLabelPipe, PuBooleanEmojiPipe} from '@app/pipes';
import {NotificationMethodsStore, SelectedTeamStore} from '@app/services';
import {paramToArray, trackBy} from '@app/util';

import {BackendType} from '../../../api';

@Component({
  template: `
    <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
      <a *isTeamAdmin mat-flat-button routerLink="new">
        {{ 'cmdk.groups.notificationMethod.create' | transloco }}
      </a>

      <div class="flex items-center gap-2">
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
          <td *matCellDef="let element" mat-cell>{{ element.useByDefault | puBooleanEmoji }}</td>
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
    MatTableModule,
    MatSortModule,
    MatPaginator,
    RouterLink,
    StopPropagationDirective,
    MatAnchor,
    MatIconButton,
    BiComponent,
    PuBooleanEmojiPipe,
    TableLoadingBar,
    DfxImplodePipe,
    TranslocoPipe,
    MatTooltip,
    MatIconAnchor,
    NotificationSenderDataValueLabelPipe,
    IsTeamAdmin,
    FormsModule,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodsPage {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  readonly typesFilter = linkedQueryParam('type', {
    parse: paramToArray<BackendType['NotificationMethodResponse']['sender']['_type']>(),
    stringify: (value) => (value.length > 0 ? value.join(',') : null),
  });

  constructor() {
    this.notificationMethodsStore.setPaginator(this.paginator);
    this.notificationMethodsStore.setSort(this.sort);
    this.notificationMethodsStore.setTypes(this.typesFilter);

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
    {value: 'EMAIL' as const, name: 'DNS'},
    {value: 'SLACK' as const, name: 'Slack'},
  ];

  protected readonly trackBy = trackBy;
}
