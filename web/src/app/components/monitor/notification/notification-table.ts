import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';

import {HlmPaginator} from '@dafnik/paginator';
import {HlmSort, HlmSortImports} from '@dafnik/sort';
import {HlmDataTableImports} from '@dafnik/table';
import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {StopPropagationDirective} from 'dfx-helper';

import {MonitorStatusTextBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {NotificationsStore} from '@app/services';
import {trackBy} from '@app/util';

import {TableLoadingBar} from '../../table-loading-bar';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="notificationsStore.entities()"
            [hlmSortActive]="notificationsStore.sortBy()"
            [hlmSortDirection]="notificationsStore.sortDirection()"
            [trackBy]="trackBy"
            hlm-data-table
            hlmSort>
            <ng-container hlmColumnDef="monitor">
              <th *hlmHeaderCellDef hlm-header-cell>{{ 'general.monitor' | transloco }}</th>
              <td class="max-w-64 truncate" *hlmCellDef="let element" hlm-cell>
                <a class="underline" [routerLink]="element.monitor.id">
                  {{ element.monitor.name }}
                </a>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="status">
              <th *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.status' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <span
                  class="rounded-md px-2 py-1 font-bold"
                  [monitor-status-text-background]="element.status">
                  {{ element.status }}
                </span>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="title">
              <th *hlmHeaderCellDef hlm-header-cell>{{ 'general.title' | transloco }}</th>
              <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                {{ element.title }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="createdAt">
              <th class="whitespace-nowrap" *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.createdAt' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <pu-relative-time [value]="element.createdAt" format="yyyy.MM.dd HH:mm:ss" />
              </td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <button
                  [hlmDropdownMenuTrigger]="menu"
                  type="button"
                  hlmBtn
                  stopPropagation
                  variant="ghost">
                  <span class="sr-only">Open notification menu</span>
                  <ng-icon hlm size="sm" name="bootstrapThreeDotsVertical" />
                </button>

                <ng-template #menu>
                  <hlm-dropdown-menu class="w-56">
                    <hlm-dropdown-menu-label>
                      {{ 'general.options' | transloco }}
                    </hlm-dropdown-menu-label>

                    <hlm-dropdown-menu-group>
                      <button
                        [routerLink]="
                          teamId() || (!teamId() && !monitorId())
                            ? element.monitor.id + '/c/' + element.checkResultId + '/logs'
                            : 'c/' + element.checkResultId + '/logs'
                        "
                        type="button"
                        hlmDropdownMenuItem>
                        <ng-icon hlm size="sm" name="bootstrapCrosshair" />
                        {{ 'notification.list.openCheckResult' | transloco }}
                      </button>
                    </hlm-dropdown-menu-group>
                  </hlm-dropdown-menu>
                </ng-template>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="notificationsStore.columnsToDisplay()" hlm-header-row></tr>
            <tr
              *hlmRowDef="let element; columns: notificationsStore.columnsToDisplay()"
              [routerLink]="
                teamId() || (!teamId() && !monitorId())
                  ? element.monitor.id + '/n/' + element.id
                  : 'n/' + element.id
              "
              hlm-row
              queryParamsHandling="merge"></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="notificationsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="notificationsStore.size()"
        [pageIndex]="notificationsStore.page()"
        [length]="notificationsStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .hlm-column-monitor {
      @apply w-64;
    }
    .hlm-column-status {
      @apply w-32;
    }
  `,
  selector: 'pu-notification-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TableLoadingBar,
    TranslocoPipe,
    RelativeTimeWithTooltip,
    MonitorStatusTextBackground,
    StopPropagationDirective,
    HlmPaginator,
    HlmTableContainer,
    HlmSortImports,
    HlmDataTableImports,
    HlmButtonImports,
    HlmDropdownMenuImports,
    HlmIconImports,
  ],
})
export class NotificationTable {
  readonly notificationsStore = inject(NotificationsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.notificationsStore.setHlmPaginator(this.paginator);
    this.notificationsStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}
