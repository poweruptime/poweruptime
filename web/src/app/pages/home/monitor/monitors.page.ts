import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {MatChip, MatChipListbox, MatChipOption} from '@angular/material/chips';
import {RouterLink, RouterOutlet} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {MonitorCardList, MonitorsFilter} from '@app/components/monitor';
import {MonitorsDashboardStore, MonitorsSearchStore, MonitorsStore} from '@app/services';
import {paramToArray} from '@app/util';

@Component({
  template: `
    <div class="grid h-full grid-cols-12 gap-4">
      <div
        class="col-span-12 flex flex-col gap-4 overflow-y-hidden pe-1 lg:col-span-5 xl:col-span-4 2xl:col-span-3">
        @let _showFilter = showFilter();
        @let dashboard = monitorsDashboardStore.dashboard();
        <div class="flex items-center justify-between">
          @if (teamId()) {
            <a mat-flat-button routerLink="new">{{ 'cmdk.groups.monitor.create' | transloco }}</a>
          } @else {
            <div></div>
          }

          <div class="flex items-center gap-2">
            <mat-chip>
              {{ dashboard?.monitorCount }}
              monitor(s)
            </mat-chip>

            <mat-chip-listbox (change)="showFilter.set(!_showFilter)">
              <mat-chip-option [selected]="_showFilter">
                <bi name="filter" />
              </mat-chip-option>
            </mat-chip-listbox>
          </div>
        </div>

        @defer (when _showFilter) {
          @if (_showFilter) {
            <pu-monitors-filter
              [filter]="{
                search: $any(searchFilter()),
                types: typesFilter(),
                statuses: statusesFilter(),
              }"
              [dashboard]="dashboard"
              (filterChange)="
                searchFilter.set($event.search);
                typesFilter.set($event.types);
                statusesFilter.set($event.statuses)
              " />
          }
        }

        @if (monitorsSearchStore.isSearching() && _showFilter) {
          <pu-monitor-card-list
            [entities]="monitorsSearchStore.entities()"
            [isPending]="monitorsSearchStore.isPending()"
            (nextPage)="monitorsSearchStore.nextPage()" />
        } @else {
          <pu-monitor-card-list
            [entities]="monitorsStore.sortedEntities()"
            [isPending]="monitorsStore.isPending()"
            (nextPage)="monitorsStore.nextPage(teamId())" />
        }
      </div>
      <div class="scroll-container col-span-12 pb-4 lg:col-span-7 xl:col-span-8 2xl:col-span-9">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    /* Hide scrollbar but allow scrolling */
    .scroll-container {
      @apply h-full overflow-y-auto;
    }

    .scroll-container::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Edge */
    }

    .scroll-container {
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    MatChip,
    BiComponent,
    MonitorCardList,
    MatChipListbox,
    MatChipOption,
    MatAnchor,
    MonitorsFilter,
    TranslocoPipe,
  ],
  providers: [MonitorsSearchStore, MonitorsDashboardStore],
  selector: 'landing-page',
})
export class MonitorsPage {
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);
  readonly monitorsStore = inject(MonitorsStore);
  readonly monitorsSearchStore = inject(MonitorsSearchStore);

  readonly teamId = input<string | undefined>(undefined);

  readonly showFilter = linkedQueryParam('showFilter', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (value) => (!value ? null : value),
    queryParamsHandling: '',
  });

  readonly searchFilter = linkedQueryParam('filter.search');
  readonly statusesFilter = linkedQueryParam<BackendType['MonitorResponse']['status'][]>(
    'filter.status',
    {
      parse: paramToArray<BackendType['MonitorResponse']['status']>(),
      stringify: (value) => value.join(','),
    },
  );
  readonly typesFilter = linkedQueryParam<BackendType['MonitorCheckerData']['_type'][]>(
    'filter.type',
    {
      parse: paramToArray<BackendType['MonitorCheckerData']['_type']>(),
      stringify: (value) => value.join(','),
    },
  );

  constructor() {
    this.monitorsDashboardStore.loadByTeamId(this.teamId);

    this.monitorsStore.loadMonitorsByTeamId(
      computed(() => ({
        teamId: this.teamId(),
        loadedAll: this.monitorsStore.loadedAll(),
        page: this.monitorsStore.page(),
      })),
    );

    this.monitorsSearchStore.setSearch(this.searchFilter);
    this.monitorsSearchStore.setStatuses(this.statusesFilter);
    this.monitorsSearchStore.setTypes(this.typesFilter);

    this.monitorsSearchStore.searchMonitorsByTeamId(
      computed(() => ({
        teamId: this.teamId(),
        page: this.monitorsSearchStore.page(),
        search: this.monitorsSearchStore.search(),
        statuses: this.monitorsSearchStore.statuses(),
        types: this.monitorsSearchStore.types(),
      })),
    );
  }
}
