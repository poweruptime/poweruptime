import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {RouterLink} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDataTableImports} from '@spartan-ng/helm/data-table';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmPaginator, HlmPaginatorImports} from '@spartan-ng/helm/paginator';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {HlmTableContainer} from '@spartan-ng/helm/table';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {MonitorStatusTextBackground} from '@app/directives';
import {LastCheckResultsStore, MonitorsStore} from '@app/services';
import {trackBy} from '@app/util';

import {TableLoadingBar} from '../';
import {InfiniteUptimeTimeline} from './uptime-timeline';

@Component({
  template: `
    <div class="grid gap-2">
      <div class="overflow-hidden">
        <div hlmTableContainer>
          <table [dataSource]="monitorsStore.entities()" [trackBy]="trackBy" hlm-data-table>
            <ng-container hlmColumnDef="team.name">
              <th *hlmHeaderCellDef hlm-header-cell>
                {{ 'general.team' | transloco }}
              </th>
              <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                <a class="underline" [routerLink]="'/t/' + element.team.id" stopPropagation>
                  {{ element.team.name }}
                </a>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="name">
              <th *hlmHeaderCellDef hlm-header-cell>
                {{ 'general.name' | transloco }}
              </th>
              <td class="whitespace-nowrap" *hlmCellDef="let element" hlm-cell>
                {{ element.name }}
              </td>
            </ng-container>

            <ng-container hlmColumnDef="status">
              <th *hlmHeaderCellDef hlm-header-cell>
                {{ 'general.status' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <strong
                  class="max-w-24 truncate rounded-lg px-2 py-1 font-bold"
                  [monitor-status-text-background]="element.status">
                  @if (element.status === 'UP') {
                    {{ element.oneDayUptime }}
                  } @else {
                    {{ element.status }}
                  }
                </strong>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="checkResults">
              <th *hlmHeaderCellDef hlm-header-cell>
                {{ 'general.checkResults' | transloco }}
              </th>
              <td *hlmCellDef="let element" hlm-cell>
                <div class="pt-1">
                  @if (checkResultsStore.loading().has(element.id)) {
                    <hlm-skeleton class="h-6 w-full" />
                  } @else {
                    <pu-infinite-uptime-timeline
                      [checkResults]="checkResultsStore.resultsMap().get(element.id) ?? []"
                      [size]="2"
                      hideLabel />
                  }
                </div>
              </td>
            </ng-container>

            <ng-container hlmColumnDef="actions">
              <th *hlmHeaderCellDef hlm-header-cell></th>
              <td *hlmCellDef="let element" hlm-cell>
                <hlm-tooltip>
                  <a
                    [routerLink]="
                      teamId() ? '/t/' + element.team.id + '/m/' + element.id : element.id
                    "
                    hlmBtn
                    variant="ghost"
                    size="icon-sm"
                    stopPropagation>
                    <ng-icon hlm size="sm" name="bootstrapArrowRight" />
                  </a>
                  <span *brnTooltipConten>{{ 'checkResult.list.action.view' | transloco }}</span>
                </hlm-tooltip>
              </td>
            </ng-container>

            <tr *hlmHeaderRowDef="monitorsStore.columnsToDisplay()" hlm-header-row></tr>

            <tr
              *hlmRowDef="let element; columns: monitorsStore.columnsToDisplay()"
              [routerLink]="teamId() ? '/t/' + element.team.id + '/m/' + element.id : element.id"
              hlm-row></tr>
          </table>
        </div>
      </div>

      <pu-table-loading-bar [loading]="monitorsStore.isPending()" />

      <hlm-paginator
        [pageSizeOptions]="[10, 20, 50, 100, 200]"
        [pageSize]="monitorsStore.size()"
        [pageIndex]="monitorsStore.page()"
        [length]="monitorsStore.totalElements()"
        showFirstLastButtons />
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .hlm-column-status {
      @apply w-32;
    }

    .hlm-column-checkResults {
      @apply w-96 min-w-96;
    }
  `,
  selector: 'pu-monitor-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TableLoadingBar,
    StopPropagationDirective,
    TranslocoPipe,
    InfiniteUptimeTimeline,
    MonitorStatusTextBackground,
    HlmSkeletonImports,
    HlmTableContainer,
    HlmDataTableImports,
    HlmPaginatorImports,
    HlmButtonImports,
    HlmIconImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
  ],
})
export class MonitorTable {
  protected readonly monitorsStore = inject(MonitorsStore);
  protected readonly checkResultsStore = inject(LastCheckResultsStore);

  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(HlmPaginator);

  constructor() {
    this.monitorsStore.setHlmPaginator(this.paginator);

    const setColumnsToDisplay = rxMethod<boolean>(
      map((includeTeamColumn) => {
        let it = ['name', 'status', 'checkResults', 'actions'];

        if (includeTeamColumn) {
          it = ['team.name', ...it];
        }

        this.monitorsStore.setColumnsToDisplay(it);
      }),
    );

    setColumnsToDisplay(computed(() => !this.teamId()));
  }

  protected readonly trackBy = trackBy;
}
