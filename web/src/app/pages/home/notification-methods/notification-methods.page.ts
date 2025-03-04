import {ChangeDetectionStrategy, Component, computed, inject, viewChild} from '@angular/core';
import {MatAnchor, MatIconButton} from '@angular/material/button';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {RouterLink} from '@angular/router';

import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxImplodePipe, StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar, injectDeleteConfirmDialog} from '@app/components';
import {PuBooleanEmojiPipe} from '@app/pipes';
import {
  NotificationMethodEditStore,
  NotificationMethodsStore,
  SelectedTeamStore,
} from '@app/services';

@Component({
  template: `
    <a mat-flat-button routerLink="new">New notification method</a>

    <table
      [dataSource]="notificationMethodsStore.entities()"
      [matSortActive]="notificationMethodsStore.sortBy()"
      [matSortDirection]="notificationMethodsStore.sortDirection()"
      mat-table
      matSort>
      <ng-container matColumnDef="name">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>Name</th>
        <td *matCellDef="let element" mat-cell>{{ element.name }}</td>
      </ng-container>

      <ng-container matColumnDef="sender._type">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>Type</th>
        <td *matCellDef="let element" mat-cell>{{ element.sender._type }}</td>
      </ng-container>

      <ng-container matColumnDef="sender">
        <th *matHeaderCellDef mat-header-cell></th>
        <td *matCellDef="let element" mat-cell>
          @switch (element.sender._type) {
            @case ('EMAIL') {
              <div class="inline-flex">
                <span>Recipient:&nbsp;</span>
                <a
                  class="font-extrabold text-green-500"
                  [href]="'mailto:' + $any(element.sender)['to']"
                  stopPropagation
                  target="_blank"
                  rel="noopener noreferrer">
                  {{ $any(element.sender)['to'] | s_implode: ', ' : 40 : '...' }}
                </a>
                <span>&nbsp;via&nbsp;</span>
                <a
                  class="font-extrabold text-green-500"
                  [href]="$any(element.sender)['host']"
                  stopPropagation
                  target="_blank"
                  rel="noopener noreferrer">
                  {{ $any(element.sender)['host'] }}
                </a>
              </div>
            }
            @case ('DISCORD') {
              <a
                class="font-extrabold text-green-500"
                [href]="$any(element.sender)['url']"
                stopPropagation
                target="_blank"
                rel="noopener noreferrer">
                {{ $any(element.sender)['url'] }}
              </a>
            }
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="useByDefault">
        <th *matHeaderCellDef mat-header-cell mat-sort-header>Use by default</th>
        <td *matCellDef="let element" mat-cell>{{ element.useByDefault | puBooleanEmoji }}</td>
      </ng-container>

      <ng-container matColumnDef="actions">
        <th *matHeaderCellDef mat-header-cell></th>
        <td *matCellDef="let element" mat-cell>
          <button
            class="mt-1"
            (click)="deleteConfirm.confirm(element.id)"
            mat-icon-button
            stopPropagation
            aria-label="Delete the notification method">
            <bi name="trash-fill" />
          </button>
        </td>
      </ng-container>

      <tr *matHeaderRowDef="notificationMethodsStore.columnsToDisplay()" mat-header-row></tr>
      <tr
        class="hover:cursor-pointer"
        *matRowDef="let element; columns: notificationMethodsStore.columnsToDisplay()"
        [routerLink]="element.id"
        mat-row></tr>
    </table>

    <pu-table-loading-bar [loading]="notificationMethodsStore.isPending()" />

    @if (notificationMethodsStore.isEmpty()) {
      <div class="mt-2 w-full text-center">No data available.</div>
    }

    <mat-paginator
      [pageSizeOptions]="[10, 20, 50, 100, 200]"
      [pageSize]="notificationMethodsStore.size()"
      [pageIndex]="notificationMethodsStore.page()"
      [length]="notificationMethodsStore.totalElements()"
      showFirstLastButtons />
  `,
  styles: `
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodsPage {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly deleteConfirm = injectDeleteConfirmDialog((id) =>
    this.notificationMethodsStore.delete(id),
  );

  readonly paginator = viewChild.required(MatPaginator);
  readonly sort = viewChild.required(MatSort);

  constructor() {
    this.notificationMethodsStore.setPaginator(this.paginator);
    this.notificationMethodsStore.setSort(this.sort);

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
}
