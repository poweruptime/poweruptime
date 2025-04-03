import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatAnchor, MatButton} from '@angular/material/button';
import {MatChip, MatChipListbox, MatChipOption} from '@angular/material/chips';
import {Router, RouterLink, RouterOutlet} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {MonitorCardList, MonitorsFilter} from '@app/components/monitor';
import {InfiniteMonitorsStore, MonitorsDashboardStore, MonitorsSearchStore} from '@app/services';
import {paramToArray} from '@app/util';

import {TeamSelect} from '../../../components/team-select';

@Component({
  template: `
    <div class="flex gap-4 overflow-y-hidden" style="height: 93vh">
      <div class="flex flex-col gap-4" style="width: 21rem; min-width: 21rem;">
        @let _showFilter = showFilter();
        @let dashboard = monitorsDashboardStore.dashboard();
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            @if (teamId()) {
              <a mat-flat-button routerLink="new">{{ 'monitor.new' | transloco }}</a>
            } @else {
              <pu-team-select (teamIdSelected)="router.navigate(['/', 't', $event, 'm', 'new'])">
                <button mat-flat-button>{{ 'monitor.new' | transloco }}</button>
              </pu-team-select>
            }
          </div>

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
      <div class="h-screen max-h-screen grow overflow-y-auto overflow-x-hidden pb-24 pe-2">
        <router-outlet />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InfiniteMonitorsStore, MonitorsSearchStore, MonitorsDashboardStore],
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
    MatButton,
    TeamSelect,
  ],
  selector: 'pu-monitors-page',
})
export class MonitorsPage {
  readonly router = inject(Router);
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);
  readonly monitorsStore = inject(InfiniteMonitorsStore);
  readonly monitorsSearchStore = inject(MonitorsSearchStore);

  readonly teamId = input<string | undefined>(undefined);

  readonly showFilter = linkedQueryParam('search.show', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (value) => (!value ? null : value),
    queryParamsHandling: '',
  });

  readonly searchFilter = linkedQueryParam('search.name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  readonly statusesFilter = linkedQueryParam<BackendType['MonitorResponse']['status'][]>(
    'search.status',
    {
      parse: paramToArray<BackendType['MonitorResponse']['status']>(),
      stringify: (value) => (value.length > 0 ? value.join(',') : null),
    },
  );
  readonly typesFilter = linkedQueryParam<BackendType['MonitorCheckerData']['_type'][]>(
    'search.type',
    {
      parse: paramToArray<BackendType['MonitorCheckerData']['_type']>(),
      stringify: (value) => (value.length > 0 ? value.join(',') : null),
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

    this.monitorsSearchStore.load(
      computed(() => ({
        ...this.monitorsSearchStore.pageable(),
        teamId: this.teamId(),
        search: this.monitorsSearchStore.search(),
        statuses: this.monitorsSearchStore.statuses(),
        types: this.monitorsSearchStore.types(),
      })),
    );
  }
}
