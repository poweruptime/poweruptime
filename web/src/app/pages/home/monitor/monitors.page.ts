import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
} from '@angular/core';
import {Router, RouterLink, RouterOutlet} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmCollapsibleImports} from '@spartan-ng/helm/collapsible';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {MonitorCardList, MonitorsEmpty, MonitorsFilter} from '@app/components/monitor';
import {TeamSelect} from '@app/components/team-select';
import {IsTeamAdmin} from '@app/directives';
import {
  InfiniteMonitorsStore,
  MonitorsDashboardStore,
  MonitorsSearchStore,
  TagsStore,
} from '@app/services';
import {toBackendDate} from '@app/services/util';

@Component({
  template: `
    @let notSearchingNotPendingAndEmpty =
      !monitorsSearchStore.isSearching() &&
      !monitorsStore.isPending() &&
      monitorsStore.sortedEntities().length === 0;
    @if (notSearchingNotPendingAndEmpty) {
      <pu-monitors-empty [inTeam]="!!teamId()" />
    } @else {
      <div class="flex gap-4">
        <div
          class="flex h-[calc(100vh-90px)] flex-col gap-4"
          style="width: 21rem; min-width: 21rem;">
          <hlm-collapsible [(expanded)]="showFilter">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                @if (teamId()) {
                  <a *isTeamAdmin hlmBtn routerLink="new">{{ 'monitor.new' | transloco }}</a>
                } @else {
                  <pu-team-select
                    (teamIdChange)="router.navigate(['/', 't', $event, 'new-monitor'])"
                    adminOnly>
                    <button hlmBtn type="button">{{ 'monitor.new' | transloco }}</button>
                  </pu-team-select>
                }
              </div>

              @let _showFilter = showFilter();

              <hlm-tooltip>
                <button
                  class="relative"
                  type="button"
                  hlmBtn
                  position="after"
                  hlmCollapsibleTrigger
                  hlmTooltipTrigger
                  variant="outline"
                  size="icon">
                  <!--              [class.rotate-90]="expanded()"-->
                  <ng-icon hlm name="bootstrapFilter" size="sm" />
                </button>
                <span *brnTooltipContent>Ctrl + F</span>
              </hlm-tooltip>
            </div>

            <hlm-collapsible-content>
              @defer (when _showFilter) {
                <section
                  class="animate-in fade-in slide-in-from-top-20 mt-4 py-4 duration-300"
                  hlmCard>
                  <div class="px-4" hlmCardContent>
                    <pu-monitors-filter
                      [filter]="{
                        search: $any(monitorsSearchStore.searchFilter()),
                        types: monitorsSearchStore.typesFilter(),
                        statuses: monitorsSearchStore.statusesFilter(),
                        tags: monitorsSearchStore.tagsFilter(),
                      }"
                      [tags]="tagsStore.entities()"
                      [dashboard]="monitorsDashboardStore.dashboard()"
                      (filterChange)="
                        monitorsSearchStore.searchFilter.set($event.search);
                        monitorsSearchStore.typesFilter.set($event.types);
                        monitorsSearchStore.statusesFilter.set($event.statuses);
                        monitorsSearchStore.tagsFilter.set($event.tags)
                      " />
                  </div>
                </section>
              }
            </hlm-collapsible-content>
          </hlm-collapsible>

          @if (monitorsSearchStore.isSearching()) {
            @if (monitorsSearchStore.isFulfilled() && monitorsSearchStore.entities().length === 0) {
              <span>No monitors found.</span>
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
        <div class="h-[calc(100vh-90px)] grow overflow-x-hidden overflow-y-auto px-2 pb-4">
          <router-outlet />
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorsSearchStore, MonitorsDashboardStore, TagsStore],
  imports: [
    RouterOutlet,
    RouterLink,
    MonitorCardList,
    MonitorsFilter,
    TranslocoPipe,
    TeamSelect,
    IsTeamAdmin,
    MonitorsEmpty,
    HlmButtonImports,
    HlmCollapsibleImports,
    HlmIconImports,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
    HlmCardImports,
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
  toggleSearch(event: Event) {
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

  protected readonly toBackendDate = toBackendDate;
}
