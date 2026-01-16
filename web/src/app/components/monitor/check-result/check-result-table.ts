import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDataTableImports} from '@spartan-ng/helm/data-table';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmPaginator} from '@spartan-ng/helm/paginator';
import {HlmSort, HlmSortImports} from '@spartan-ng/helm/sort';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {TableLoadingBar} from '@app/components';
import {MonitorStatusTextBackground} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';
import {CheckResultsStore} from '@app/services';
import {trackBy} from '@app/util';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table
            [dataSource]="checkResultsStore.entities()"
            [trackBy]="trackBy"
            [hlmSortActive]="checkResultsStore.sortBy()"
            [hlmSortDirection]="checkResultsStore.sortDirection()"
            hlm-data-table
            hlmSort>
            <ng-container hlmColumnDef="monitor">
              <th *hlmHeaderCellDef hlm-header-cell>{{ 'general.monitor' | transloco }}</th>
              <td class="max-w-64 truncate" *hlmCellDef="let element" hlm-cell>
                <a class="underline" [routerLink]="element.monitor.id" stopPropagation>
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

            <ng-container hlmColumnDef="createdAt">
              <th class="whitespace-nowrap" *hlmHeaderCellDef hlm-header-cell hlm-sort-header>
                {{ 'general.createdAt' | transloco }}
              </th>
              <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                <pu-relative-time [value]="element.createdAt" format="yyyy.MM.dd HH:mm:ss" />
              </td>
            </ng-container>

            <ng-container hlmColumnDef="title">
              <th *hlmHeaderCellDef hlm-header-cell>{{ 'general.title' | transloco }}</th>
              <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                {{ element.title }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <hlm-tooltip>
                  <a
                    [attr.aria-label]="'checkResult.list.action.view' | transloco"
                    [routerLink]="
                      teamId() || (!teamId() && !monitorId())
                        ? element.monitor.id + '/c/' + element.id + '/logs'
                        : 'c/' + element.id + '/logs'
                    "
                    hlmTooltipTrigger
                    position="left"
                    hlmBtn
                    variant="ghost"
                    size="icon"
                    target="_blank"
                    stopPropagation>
                    <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
                  </a>
                  <span *brnTooltipContent>{{ 'checkResult.list.action.view' | transloco }}</span>
                </hlm-tooltip>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="checkResultsStore.columnsToDisplay()" hlm-header-row></tr>
            <tr
              *hlmRowDef="let element; columns: checkResultsStore.columnsToDisplay()"
              [routerLink]="
                teamId() || (!teamId() && !monitorId())
                  ? element.monitor.id + '/c/' + element.id + '/logs'
                  : 'c/' + element.id + '/logs'
              "
              hlm-row
              queryParamsHandling="merge"></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="checkResultsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="checkResultsStore.size()"
        [pageIndex]="checkResultsStore.page()"
        [length]="checkResultsStore.totalElements()"
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
  selector: 'pu-check-result-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TableLoadingBar,
    RelativeTimeWithTooltip,
    StopPropagationDirective,
    TranslocoPipe,
    MonitorStatusTextBackground,
    HlmPaginator,
    HlmTableContainer,
    HlmDataTableImports,
    HlmSortImports,
    HlmButtonImports,
    HlmIconImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
  ],
})
export class CheckResultTable {
  readonly checkResultsStore = inject(CheckResultsStore);

  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(HlmPaginator);
  private readonly sort = viewChild.required(HlmSort);

  constructor() {
    this.checkResultsStore.setHlmPaginator(this.paginator);
    this.checkResultsStore.setHlmSort(this.sort);
  }

  protected readonly trackBy = trackBy;
}
