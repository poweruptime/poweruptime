import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {MatIconAnchor} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BiComponent} from 'dfx-bootstrap-icons';

import {TableLoadingBar} from '@app/components';
import {MonitorStatusBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {NotificationsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <mat-card appearance="outlined">
        <mat-card-content>
          <h2 class="text-xl">Notifications</h2>

          <div class="table-responsive">
            <table
              [dataSource]="notificationsStore.entities()"
              [matSortActive]="notificationsStore.sortBy()"
              [matSortDirection]="notificationsStore.sortDirection()"
              [trackBy]="trackBy"
              mat-table
              matSort>
              <ng-container matColumnDef="monitor">
                <th *matHeaderCellDef mat-header-cell>{{ 'general.monitor' | transloco }}</th>
                <td class="max-w-64 truncate" *matCellDef="let element" mat-cell>
                  <a class="underline" [routerLink]="element.monitor.id">
                    {{ element.monitor.name }}
                  </a>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th *matHeaderCellDef mat-header-cell mat-sort-header>
                  {{ 'general.status' | transloco }}
                </th>
                <td *matCellDef="let element" mat-cell>
                  <span
                    class="rounded-md px-2 py-1 font-bold"
                    [monitor-status-background]="element.checkResult.status">
                    {{ element.checkResult.status }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="createdAt">
                <th class="whitespace-nowrap" *matHeaderCellDef mat-header-cell mat-sort-header>
                  {{ 'general.createdAt' | transloco }}
                </th>
                <td *matCellDef="let element" mat-cell>
                  <pu-relative-time [value]="element.createdAt" format="YYYY.MM.dd HH:mm:ss" />
                </td>
              </ng-container>

              <ng-container matColumnDef="method">
                <th *matHeaderCellDef mat-header-cell>{{ 'general.method' | transloco }}</th>
                <td *matCellDef="let element" mat-cell>
                  {{ element.method.name }}
                </td>
              </ng-container>

              <ng-container matColumnDef="title">
                <th *matHeaderCellDef mat-header-cell>{{ 'general.title' | transloco }}</th>
                <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
                  {{ element.title }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th *matHeaderCellDef mat-header-cell></th>
                <td *matCellDef="let element" mat-cell>
                  <a
                    [matTooltip]="'notification.list.openCheckResult' | transloco"
                    [attr.aria-label]="'notification.list.openCheckResult' | transloco"
                    [routerLink]="
                      teamId() || (!teamId() && !monitorId())
                        ? element.monitor.id + '/c/' + element.checkResult.id + '/logs'
                        : 'c/' + element.checkResult.id + '/logs'
                    "
                    matTooltipPosition="left"
                    mat-icon-button>
                    <bi name="crosshair" />
                  </a>
                </td>
              </ng-container>

              <tr *matHeaderRowDef="notificationsStore.columnsToDisplay()" mat-header-row></tr>
              <tr *matRowDef="let row; columns: notificationsStore.columnsToDisplay()" mat-row></tr>
            </table>
          </div>

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
    @reference "../../../styles.css";

    .mat-column-monitor {
      @apply w-64;
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
    MatCard,
    MatCardContent,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    MonitorStatusBackground,
    RouterLink,
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    BiComponent,
    MatTooltip,
    MatIconAnchor,
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
        let it = ['status', 'createdAt', 'method', 'title', 'actions'];

        if (includeMonitorColumn) {
          it = ['monitor', ...it];
        }

        this.notificationsStore.setColumnsToDisplay(it);
      }),
    );

    setColumnsToDisplay(computed(() => !this.monitorId()));
  }

  protected readonly trackBy = trackBy;
}
