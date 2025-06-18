import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {MatButton} from '@angular/material/button';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {Router, RouterLink, RouterOutlet} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType, MonitorDataType} from '@app/api';
import {MonitorCardList, MonitorsFilter} from '@app/components/monitor';
import {TeamSelect} from '@app/components/team-select';
import {IsTeamAdmin} from '@app/directives';
import {
  InfiniteMonitorsStore,
  MonitorsDashboardStore,
  MonitorsSearchStore,
  TagsStore,
} from '@app/services';
import {arrayToParam, paramToArray} from '@app/util';

@Component({
  template: `
    <div class="flex gap-4">
      <div class="flex flex-col gap-4" style="width: 21rem; min-width: 21rem;">
        @let _showFilter = showFilter();
        @let dashboard = monitorsDashboardStore.dashboard();
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            @if (teamId()) {
              <a *isTeamAdmin mat-flat-button routerLink="new">{{ 'monitor.new' | transloco }}</a>
            } @else {
              <pu-team-select
                (teamIdSelected)="router.navigate(['/', 't', $event, 'm', 'new'])"
                adminOnly>
                <button mat-flat-button type="button">{{ 'monitor.new' | transloco }}</button>
              </pu-team-select>
            }
          </div>

          <mat-chip-listbox (change)="showFilter.set(!_showFilter)">
            <mat-chip-option [selected]="_showFilter">
              <bi name="filter" />
            </mat-chip-option>
          </mat-chip-listbox>
        </div>

        @defer (when _showFilter) {
          @if (_showFilter) {
            <pu-monitors-filter
              [filter]="{
                search: $any(searchFilter()),
                types: typesFilter(),
                statuses: statusesFilter(),
                tags: tagsFilter(),
              }"
              [tags]="tagsStore.entities()"
              [dashboard]="dashboard"
              (filterChange)="
                searchFilter.set($event.search);
                typesFilter.set($event.types);
                statusesFilter.set($event.statuses);
                tagsFilter.set($event.tags)
              " />
          }
        }

        @if (isSearching()) {
          @if (monitorsSearchStore.isFulfilled() && monitorsSearchStore.entities().length === 0) {
            <span>No monitors found.</span>
          }
        } @else {
          @if (!monitorsStore.isPending() && monitorsStore.entities().length === 0) {
            <span>{{ 'monitor.empty' | transloco }}</span>
          }
        }

        @if (isSearching() && _showFilter) {
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
      <div class="content grow overflow-y-auto overflow-x-hidden px-2 pb-24">
        <router-outlet />
      </div>
    </div>
  `,
  styles: `
    .content {
      height: 92.5vh;
      max-height: 92.5vh;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InfiniteMonitorsStore, MonitorsSearchStore, MonitorsDashboardStore, TagsStore],
  imports: [
    RouterOutlet,
    RouterLink,
    BiComponent,
    MonitorCardList,
    MatChipListbox,
    MatChipOption,
    MonitorsFilter,
    TranslocoPipe,
    MatButton,
    TeamSelect,
    IsTeamAdmin,
  ],
  selector: 'pu-monitors-page',
})
export class MonitorsPage {
  readonly router = inject(Router);
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);
  readonly monitorsStore = inject(InfiniteMonitorsStore);
  readonly monitorsSearchStore = inject(MonitorsSearchStore);
  readonly tagsStore = inject(TagsStore);

  readonly teamId = input<string | undefined>(undefined);

  readonly showFilter = linkedQueryParam('search.show', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (value) => (!value ? null : value),
    queryParamsHandling: '',
  });

  readonly searchFilter = linkedQueryParam('search.name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  readonly statusesFilter = linkedQueryParam('search.status', {
    parse: paramToArray<BackendType['MonitorResponse']['status']>(),
    stringify: arrayToParam(),
  });
  readonly typesFilter = linkedQueryParam('search.type', {
    parse: paramToArray<MonitorDataType>(),
    stringify: arrayToParam(),
  });
  readonly tagsFilter = linkedQueryParam('search.tag', {
    parse: paramToArray<string>(),
    stringify: arrayToParam(),
  });

  isSearching = computed(
    () =>
      (this.searchFilter() && this.searchFilter()!.length > 0) ||
      (this.statusesFilter() && this.statusesFilter()!.length > 0) ||
      (this.typesFilter() && this.typesFilter()!.length > 0) ||
      (this.tagsFilter() && this.tagsFilter()!.length > 0),
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

    this.monitorsSearchStore.load(
      computed(() => ({
        ...this.monitorsSearchStore.pageable(),
        teamId: this.teamId() ?? undefined,
        search: this.searchFilter() ?? undefined,
        statuses: this.statusesFilter() ?? undefined,
        types: this.typesFilter() ?? undefined,
        tags: this.tagsFilter() ?? undefined,
      })),
    );

    this.tagsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        page: 0,
        size: 200,
      })),
    );
  }
}
