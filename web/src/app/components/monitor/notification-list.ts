import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {RouterLink} from '@angular/router';

import {map} from 'rxjs';

import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {TableLoadingBar} from '@app/components';
import {MonitorStatusBackground} from '@app/directives';
import {NotificationsStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <mat-card appearance="outlined">
        <mat-card-content>
          <h2 class="text-xl">Notifications</h2>

          <table
            [dataSource]="notificationsStore.entities()"
            [matSortActive]="notificationsStore.sortBy()"
            [matSortDirection]="notificationsStore.sortDirection()"
            mat-table
            matSort>
            <ng-container matColumnDef="monitor">
              <th *matHeaderCellDef mat-header-cell>Monitor</th>
              <td *matCellDef="let element" mat-cell>
                <a class="underline" [routerLink]="element.monitor.id">
                  {{ element.monitor.name }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th *matHeaderCellDef mat-header-cell mat-sort-header>Status</th>
              <td *matCellDef="let element" mat-cell>
                <span
                  class="rounded-md px-2 py-1 font-bold"
                  [monitor-status-background]="element.checkResult.status">
                  {{ element.checkResult.status }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th *matHeaderCellDef mat-header-cell mat-sort-header>Created at</th>
              <td *matCellDef="let element" mat-cell>
                {{ element.createdAt | date: 'YYYY.MM.dd HH:mm:ss' }}
              </td>
            </ng-container>

            <ng-container matColumnDef="method">
              <th *matHeaderCellDef mat-header-cell>Method</th>
              <td *matCellDef="let element" mat-cell>
                {{ element.method.name }}
              </td>
            </ng-container>

            <ng-container matColumnDef="title">
              <th *matHeaderCellDef mat-header-cell>Title</th>
              <td *matCellDef="let element" mat-cell>{{ element.title }}</td>
            </ng-container>

            <tr *matHeaderRowDef="notificationsStore.columnsToDisplay()" mat-header-row></tr>
            <tr *matRowDef="let row; columns: notificationsStore.columnsToDisplay()" mat-row></tr>
          </table>

          <pu-table-loading-bar [loading]="notificationsStore.isPending()" />

          @if (notificationsStore.isEmpty()) {
            <div class="mt-2 w-full text-center">No data available.</div>
          }

          <mat-paginator
            [pageSizeOptions]="[10, 20, 50, 100, 200]"
            [pageSize]="notificationsStore.size()"
            [pageIndex]="notificationsStore.page()"
            [length]="notificationsStore.totalElements()"
            showFirstLastButtons />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    .mat-column-monitor {
      @apply w-52;
    }
    .mat-column-status {
      @apply w-32;
    }
    .mat-column-method {
      @apply w-52;
    }

    .mat-column-createdAt {
      @apply w-52;
    }
  `,
  selector: 'pu-notification-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationsStore],
  imports: [
    DatePipe,
    MatCard,
    MatCardContent,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    MonitorStatusBackground,
    RouterLink,
    TableLoadingBar,
  ],
})
export class NotificationList {
  readonly notificationsStore = inject(NotificationsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  constructor() {
    this.notificationsStore.setPaginator(this.paginator);
    this.notificationsStore.setSort(this.sort);

    this.notificationsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        monitorId: this.monitorId(),
        ...this.notificationsStore.pageable(),
      })),
    );

    const setColumnsToDisplay = rxMethod<boolean>(
      map((includeMonitorColumn) => {
        let it = ['status', 'createdAt', 'method', 'title'];

        if (includeMonitorColumn) {
          it = ['monitor', ...it];
        }

        this.notificationsStore.setColumnsToDisplay(it);
      }),
    );

    setColumnsToDisplay(computed(() => !this.monitorId()));
  }
}
