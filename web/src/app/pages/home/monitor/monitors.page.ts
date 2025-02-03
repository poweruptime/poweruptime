import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatAnchor} from '@angular/material/button';
import {MatChip, MatChipListbox, MatChipOption} from '@angular/material/chips';
import {Router, RouterLink, RouterOutlet} from '@angular/router';

import {BiComponent} from 'dfx-bootstrap-icons';
import {effectOnceIf} from 'ngxtension/effect-once-if';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import type {BackendType} from '@app/api';
import {MonitorCardList, MonitorsFilter} from '@app/components/monitor';
import {
  MonitorsDashboardStore,
  MonitorsSearchStore,
  MonitorsStore,
  SelectedTeamStore,
} from '@app/services';

@Component({
  template: `
    <div class="grid h-full grid-cols-12 gap-4">
      <div
        class="col-span-12 flex flex-col gap-4 overflow-y-hidden pe-1 lg:col-span-5 xl:col-span-4 2xl:col-span-3">
        @let _showFilter = showFilter();
        @let dashboard = monitorsDashboardStore.dashboard();
        <div class="flex items-center justify-between">
          @if (selectedTeamStore.selectedTeamId()) {
            <a mat-flat-button routerLink="new">New monitor</a>
          } @else {
            <div></div>
          }

          <div class="flex items-center gap-2">
            <mat-chip>
              {{ dashboard?.monitorCount }}
              monitor(s)
            </mat-chip>

            <mat-chip-listbox (change)="setShowFilter(!_showFilter)">
              <mat-chip-option [selected]="_showFilter">
                <bi name="filter" />
              </mat-chip-option>
            </mat-chip-listbox>
          </div>
        </div>

        @if (_showFilter) {
          <pu-monitors-filter
            [searchControl]="searchControl"
            [statusFilterControl]="statusFilterControl"
            [dashboard]="dashboard" />
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
            (nextPage)="monitorsStore.nextPage(this.selectedTeamStore.selectedTeamId())" />
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
  ],
  providers: [MonitorsSearchStore, MonitorsDashboardStore],
  selector: 'landing-page',
})
export class MonitorsPage {
  private readonly router = inject(Router);
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorsDashboardStore = inject(MonitorsDashboardStore);
  readonly monitorsStore = inject(MonitorsStore);
  readonly monitorsSearchStore = inject(MonitorsSearchStore);

  readonly showFilter = injectQueryParams('showFilter', {
    transform: booleanAttribute,
  });
  setShowFilter(showFilter: boolean) {
    void this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: {
        showFilter: showFilter ? true : null,
        status: showFilter ? undefined : null,
        search: showFilter ? undefined : null,
      },
    });
    if (!showFilter) {
      this.searchControl.setValue('');
      this.statusFilterControl.setValue([]);
    }
  }

  readonly searchParam = injectQueryParams('search');
  readonly searchControl = new FormControl<string>('');
  readonly statusesParam = injectQueryParams.array('status', {
    transform: (it) => {
      if (it === 'UP' || it === 'DOWN' || it === 'MAINTENANCE' || it === 'PAUSED') {
        return it;
      }
      return '';
    },
  });
  readonly statusFilterControl = new FormControl<BackendType['MonitorResponse']['status'][]>([]);

  constructor() {
    this.monitorsDashboardStore.loadByTeamId(this.selectedTeamStore.selectedTeamId);

    effect(() => {
      const statuses = this.statusesParam();
      if (statuses) {
        this.statusFilterControl.setValue(
          statuses.filter((it): it is BackendType['MonitorResponse']['status'] => it !== ''),
        );
      }
    });

    effectOnceIf(
      () => this.searchParam(),
      (search) => this.searchControl.setValue(search),
    );

    this.monitorsStore.loadMonitorsByTeamId(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        loadedAll: this.monitorsStore.loadedAll(),
        page: this.monitorsStore.page(),
      })),
    );

    this.monitorsSearchStore.setSearch(this.searchControl.valueChanges);
    this.monitorsSearchStore.setStatuses(this.statusFilterControl.valueChanges);

    this.monitorsSearchStore.searchMonitorsByTeamId(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        page: this.monitorsSearchStore.page(),
        search: this.monitorsSearchStore.search(),
        statuses: this.monitorsSearchStore.statuses(),
      })),
    );
  }
}
