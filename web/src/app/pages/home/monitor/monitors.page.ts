import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';

import {MatButton} from '@angular/material/button';
import {MatChipListbox, MatChipOption} from '@angular/material/chips';
import {MatTooltip} from '@angular/material/tooltip';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {MonitorCardList, MonitorsFilter} from '@app/components/monitor';
import {TeamSelect} from '@app/components/team-select';
import {IsTeamAdmin} from '@app/directives';
import {
  InfiniteMonitorsStore,
  MonitorsDashboardStore,
  MonitorsSearchStore,
  TagsStore,
} from '@app/services';

@Component({
  template: `
    <div class="flex gap-4">
      <div class="flex h-[calc(100vh-76px)] flex-col gap-4" style="width: 21rem; min-width: 21rem;">
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

          <mat-chip-listbox
            (change)="showFilter.set(!_showFilter)"
            matTooltip="Ctrl + F"
            matTooltipPosition="after">
            <mat-chip-option [selected]="_showFilter">
              <bi name="filter" />
            </mat-chip-option>
          </mat-chip-listbox>
        </div>

        @defer (when _showFilter) {
          @if (_showFilter) {
            <pu-monitors-filter
              [filter]="{
                search: $any(monitorsSearchStore.searchFilter()),
                types: monitorsSearchStore.typesFilter(),
                statuses: monitorsSearchStore.statusesFilter(),
                tags: monitorsSearchStore.tagsFilter(),
              }"
              [tags]="tagsStore.entities()"
              [dashboard]="dashboard"
              (filterChange)="
                monitorsSearchStore.searchFilter.set($event.search);
                monitorsSearchStore.typesFilter.set($event.types);
                monitorsSearchStore.statusesFilter.set($event.statuses);
                monitorsSearchStore.tagsFilter.set($event.tags)
              " />
          }
        }

        @if (monitorsSearchStore.isSearching()) {
          @if (monitorsSearchStore.isFulfilled() && monitorsSearchStore.entities().length === 0) {
            <span>No monitors found.</span>
          }
        } @else {
          @if (!monitorsStore.isPending() && monitorsStore.entities().length === 0) {
            <span>{{ 'monitor.empty' | transloco }}</span>
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
      <div class="h-[calc(100vh-76px)] grow overflow-y-auto overflow-x-hidden px-2 pb-24">
        <router-outlet />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorsSearchStore, MonitorsDashboardStore, TagsStore],
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
    MatTooltip,
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

  @HostListener('window:keydown.control.f', ['$event'])
  toggleSearch(event: KeyboardEvent) {
    event.preventDefault();
    this.showFilter.set(!this.showFilter());
  }

  constructor() {
    this.monitorsDashboardStore.loadByTeamId(this.teamId);

    this.monitorsStore.loadMonitorsByTeamId(
      computed(() => ({
        teamId: this.teamId(),
        page: this.monitorsStore.page(),
      })),
    );

    this.monitorsSearchStore.load(
      computed(() => ({
        ...this.monitorsSearchStore.pageable(),
        teamId: this.teamId() ?? undefined,
        search: this.monitorsSearchStore.searchFilter() ?? undefined,
        statuses: this.monitorsSearchStore.statusesFilter() ?? undefined,
        types: this.monitorsSearchStore.typesFilter() ?? undefined,
        tags: this.monitorsSearchStore.tagsFilter() ?? undefined,
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
