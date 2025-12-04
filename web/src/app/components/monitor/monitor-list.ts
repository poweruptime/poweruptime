import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {RouterLink} from '@angular/router';

import {MatIconAnchor} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatPaginator} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatTooltip} from '@angular/material/tooltip';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {StopPropagationDirective} from 'dfx-helper';

import {MonitorStatusTextBackground} from '@app/directives';
import {LastCheckResultsStore, MonitorsStore} from '@app/services';
import {trackBy} from '@app/util';

import {Placeholder, TableLoadingBar} from '../';
import {InfiniteUptimeTimeline} from './uptime-timeline';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <mat-card appearance="outlined">
        <mat-card-content>
          <h2 class="text-xl">Monitors</h2>

          <div class="table-responsive">
            <table [dataSource]="monitorsStore.entities()" [trackBy]="trackBy" mat-table>
              <ng-container matColumnDef="team.name">
                <th *matHeaderCellDef mat-header-cell>
                  {{ 'general.team' | transloco }}
                </th>
                <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
                  <a class="underline" [routerLink]="'/t/' + element.team.id" stopPropagation>
                    {{ element.team.name }}
                  </a>
                </td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th *matHeaderCellDef mat-header-cell>
                  {{ 'general.name' | transloco }}
                </th>
                <td class="whitespace-nowrap" *matCellDef="let element" mat-cell>
                  {{ element.name }}
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th *matHeaderCellDef mat-header-cell>
                  {{ 'general.status' | transloco }}
                </th>
                <td *matCellDef="let element" mat-cell>
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

              <ng-container matColumnDef="checkResults">
                <th *matHeaderCellDef mat-header-cell>
                  {{ 'general.checkResults' | transloco }}
                </th>
                <td *matCellDef="let element" mat-cell>
                  <div class="pt-1">
                    @if (checkResultsStore.loading().has(element.id)) {
                      <pu-placeholder class="h-6 w-full" />
                    } @else {
                      <pu-infinite-uptime-timeline
                        [checkResults]="checkResultsStore.resultsMap().get(element.id) ?? []"
                        [size]="2"
                        hideLabel />
                    }
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th *matHeaderCellDef mat-header-cell></th>
                <td *matCellDef="let element" mat-cell>
                  <a
                    [matTooltip]="'checkResult.list.action.view' | transloco"
                    [attr.aria-label]="'checkResult.list.action.view' | transloco"
                    [routerLink]="
                      teamId() ? '/t/' + element.team.id + '/m/' + element.id : element.id
                    "
                    matTooltipPosition="left"
                    mat-icon-button
                    stopPropagation>
                    <ng-icon name="bootstrapArrowRight" />
                  </a>
                </td>
              </ng-container>

              <tr *matHeaderRowDef="monitorsStore.columnsToDisplay()" mat-header-row></tr>

              <tr
                *matRowDef="let element; columns: monitorsStore.columnsToDisplay()"
                [routerLink]="teamId() ? '/t/' + element.team.id + '/m/' + element.id : element.id"
                mat-row></tr>
            </table>
          </div>

          <pu-table-loading-bar [loading]="monitorsStore.isPending()" />

          @if (monitorsStore.isEmpty()) {
            <div class="mt-2 w-full text-center">{{ 'general.noDataAvailable' | transloco }}</div>
          }

          <mat-paginator
            [pageSizeOptions]="[10, 20, 50, 100, 200]"
            [pageSize]="monitorsStore.size()"
            [pageIndex]="monitorsStore.page()"
            [length]="monitorsStore.totalElements()"
            showFirstLastButtons />
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .mat-column-status {
      @apply w-32;
    }

    .mat-column-checkResults {
      @apply w-96 min-w-96;
    }
  `,
  selector: 'pu-monitor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatTableModule,
    MatPaginator,
    MatSortModule,
    RouterLink,
    TableLoadingBar,
    StopPropagationDirective,
    NgIcon,
    MatIconAnchor,
    TranslocoPipe,
    MatTooltip,
    InfiniteUptimeTimeline,
    MonitorStatusTextBackground,
    Placeholder,
  ],
})
export class MonitorList {
  readonly monitorsStore = inject(MonitorsStore);
  protected readonly checkResultsStore = inject(LastCheckResultsStore);

  readonly teamId = input<string>();

  private readonly paginator = viewChild.required(MatPaginator);

  constructor() {
    this.monitorsStore.setPaginator(this.paginator);

    this.monitorsStore.load(
      computed(() => ({
        ...this.monitorsStore.pageable(),
        teamId: this.teamId(),
        sort: ['status_asc', 'name_asc'],
      })),
    );

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

    this.checkResultsStore.loadAll(
      computed(() => this.monitorsStore.entities().map((it) => it.id)),
    );
  }

  protected readonly trackBy = trackBy;
}
