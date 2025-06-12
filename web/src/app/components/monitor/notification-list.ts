import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MatIconAnchor} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatPaginator} from '@angular/material/paginator';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {TableLoadingBar} from '@app/components';
import {MonitorStatusTextBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {NotificationsStore} from '@app/services';
import {arrayToParam, paramToArray, trackBy} from '@app/util';

import {BackendType} from '../../api';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <mat-card appearance="outlined">
        <mat-card-content>
          <div class="flex flex-wrap justify-between">
            <h2 class="text-xl">Notifications</h2>

            <div class="flex flex-wrap items-center justify-end gap-2">
              <mat-form-field subscriptSizing="dynamic">
                <mat-label>{{ 'general.status' | transloco }}</mat-label>
                <bi name="arrow-down-up" matIconPrefix />
                <mat-select [(ngModel)]="statuses" multiple>
                  @for (status of availableStatuses(); track status.status) {
                    <mat-option [value]="status.status">
                      {{ status.name }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field subscriptSizing="dynamic">
                <mat-label>{{ 'general.type' | transloco }}</mat-label>
                <mat-select [(ngModel)]="typesFilter" multiple>
                  @for (type of types(); track type.value) {
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
                    [monitor-status-text-background]="element.checkResult.status">
                    {{ element.checkResult.status }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="title">
                <th *matHeaderCellDef mat-header-cell>{{ 'general.title' | transloco }}</th>
                <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
                  {{ element.title }}
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

              <ng-container matColumnDef="actions">
                <th *matHeaderCellDef mat-header-cell></th>
                <td *matCellDef="let element" mat-cell>
                  <div class="flex gap-2">
                    <a
                      [matTooltip]="'notification.list.openCheckResult' | transloco"
                      [attr.aria-label]="'notification.list.openCheckResult' | transloco"
                      [routerLink]="
                        teamId() || (!teamId() && !monitorId())
                          ? element.monitor.id + '/c/' + element.checkResult.id + '/logs'
                          : 'c/' + element.checkResult.id + '/logs'
                      "
                      matTooltipPosition="left"
                      mat-icon-button
                      stopPropagation>
                      <bi name="crosshair" />
                    </a>

                    <a
                      [matTooltip]="'notification.list.view' | transloco"
                      [attr.aria-label]="'notification.list.view' | transloco"
                      [routerLink]="
                        teamId() || (!teamId() && !monitorId())
                          ? element.monitor.id + '/n/' + element.id
                          : 'n/' + element.id
                      "
                      matTooltipPosition="left"
                      mat-icon-button
                      stopPropagation>
                      <bi name="arrow-right" />
                    </a>
                  </div>
                </td>
              </ng-container>

              <tr *matHeaderRowDef="notificationsStore.columnsToDisplay()" mat-header-row></tr>
              <tr
                *matRowDef="let element; columns: notificationsStore.columnsToDisplay()"
                [routerLink]="
                  teamId() || (!teamId() && !monitorId())
                    ? element.monitor.id + '/n/' + element.id
                    : 'n/' + element.id
                "
                mat-row
                queryParamsHandling="merge"></tr>
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
    @reference "#styles.css";

    .mat-column-monitor {
      @apply w-64;
    }

    .mat-column-status {
      @apply w-32;
    }
    .mat-column-actions {
      @apply w-24;
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
    RouterLink,
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    BiComponent,
    MatTooltip,
    MatIconAnchor,
    MonitorStatusTextBackground,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    FormsModule,
    StopPropagationDirective,
  ],
})
export class NotificationList {
  readonly notificationsStore = inject(NotificationsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(MatPaginator);
  private readonly sort = viewChild.required(MatSort);

  statuses = linkedQueryParam('notifi.status', {
    parse: paramToArray<BackendType['CheckResultResponse']['status']>(),
    stringify: arrayToParam(),
  });
  typesFilter = linkedQueryParam('notifi.types', {
    parse: paramToArray<BackendType['NotificationMethodResponse']['sender']['_type']>(),
    stringify: arrayToParam(),
  });

  readonly availableStatuses = signal([
    {status: 'UP' as const, name: 'Up'},
    {status: 'DOWN' as const, name: 'Down'},
  ]);

  readonly types = signal([
    {value: 'DISCORD' as const, name: 'Discord'},
    {value: 'EMAIL' as const, name: 'Email'},
    {value: 'SLACK' as const, name: 'Slack'},
  ]);

  constructor() {
    this.notificationsStore.setPaginator(this.paginator);
    this.notificationsStore.setSort(this.sort);

    this.notificationsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        monitorId: this.monitorId(),
        methods: this.typesFilter(),
        statuses: this.statuses(),
        ...this.notificationsStore.pageable(),
      })),
    );

    const setColumnsToDisplay = rxMethod<boolean>(
      map((includeMonitorColumn) => {
        let it = ['status', 'createdAt', 'title', 'actions'];

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
