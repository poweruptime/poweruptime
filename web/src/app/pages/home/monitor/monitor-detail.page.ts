import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmButtonGroupImports} from '@spartan-ng/helm/button-group';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {CheckResultList, MonitorStatus, NotificationList} from '@app/components/monitor';
import {MonitorDetail} from '@app/components/monitor/detail';
import {IsTeamAdmin} from '@app/directives';
import {MonitorCheckerDataValueLabelPipe} from '@app/pipes';
import {MonitorActionStore, MonitorDetailStore} from '@app/services';

import {MonitorEditPage} from './monitor-edit.page';

@Component({
  template: `
    @let _monitorId = monitorId();

    <hlm-tabs class="mt-4" [tab]="tab()" (tabActivated)="tab.set($event)">
      <header class="bg-background sticky top-0 z-50 mb-4 grid gap-4 border-b pb-2">
        @if (monitorDetailStore.monitor(); as monitor) {
          <div class="flex flex-wrap justify-between gap-4">
            <div class="flex items-center gap-4">
              <pu-monitor-status [status]="monitor.status" />
              <h1 class="text-foreground text-xl font-semibold">{{ monitor.name }}</h1>

              <a
                [routerLink]="[]"
                [queryParams]="{'search.show': true, 'search.type': monitor.data._type}"
                hlmBadge
                variant="outline"
                queryParamsHandling="merge">
                {{ monitor.data._type | monitorCheckerDataValueLabel | transloco }}
              </a>
            </div>

            <div *isTeamAdmin hlmButtonGroup>
              @if (monitorDetailStore.monitor()?.status === 'PAUSED') {
                <button
                  (click)="monitorActionStore.start(_monitorId)"
                  variant="outline"
                  hlmBtn
                  type="button">
                  <ng-icon hlm size="sm" name="bootstrapPlayBtn" />
                  {{ 'general.start' | transloco }}
                </button>
              } @else {
                <button
                  (click)="monitorActionStore.pause(_monitorId)"
                  hlmBtn
                  variant="outline"
                  type="button">
                  <ng-icon hlm size="sm" name="bootstrapPauseBtn" />
                  {{ 'general.pause' | transloco }}
                </button>
              }
              <button
                [attr.aria-label]="'general.menu' | transloco"
                [hlmDropdownMenuTrigger]="menu"
                type="button"
                hlmBtn
                variant="outline"
                align="end">
                <ng-icon name="bootstrapThreeDotsVertical" />
              </button>
              <ng-template #menu>
                <hlm-dropdown-menu class="w-52">
                  <hlm-dropdown-menu-group>
                    <a hlmDropdownMenuItem href="/public/m/{{ _monitorId }}" target="_blank">
                      <ng-icon hlm name="bootstrapBoxArrowUpRight" size="sm" />
                      <span>{{ 'monitor.details.openPublic' | transloco }}</span>
                    </a>
                  </hlm-dropdown-menu-group>
                  <hlm-dropdown-menu-separator />
                  <hlm-dropdown-menu-group>
                    <button
                      (click)="monitorActionStore.clone({id: _monitorId})"
                      hlmDropdownMenuItem
                      type="button">
                      <ng-icon hlm name="bootstrapCopy" size="sm" />
                      <span>{{ 'general.copy' | transloco }}</span>
                    </button>
                    <button
                      class="hover:bg-destructive/10 dark:hover:bg-destructive/40"
                      (click)="monitorActionStore.delete(_monitorId)"
                      type="button"
                      hlmDropdownMenuItem
                      variant="destructive">
                      <ng-icon hlm name="lucideTrash" size="sm" />
                      <span>
                        {{ 'general.delete' | transloco }}
                      </span>
                    </button>
                  </hlm-dropdown-menu-group>
                </hlm-dropdown-menu>
              </ng-template>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-between">
            <hlm-skeleton class="h-12 w-64" />
            <hlm-skeleton class="h-12 w-12" />
          </div>
        }

        <div class="overflow-x-auto overflow-y-hidden">
          <hlm-tabs-list
            class="[&>button]:data-[state=active]:bg-primary [&>button]:data-[state=active]:text-primary-foreground min-w-content inline-flex gap-3 bg-transparent [&>button]:px-3 [&>button]:py-1.5 [&>button]:data-[state=active]:rounded-full [&>button]:data-[state=active]:shadow-none"
            aria-label="Monitor tabs">
            <button type="button" hlmTabsTrigger="overview">
              <ng-icon hlm name="lucideLayoutDashboard" size="sm" />
              {{ 'general.overview' | transloco }}
            </button>
            <button type="button" hlmTabsTrigger="notifications">
              <ng-icon hlm name="bootstrapBell" size="sm" />
              {{ 'general.notifications' | transloco }}
            </button>
            <button type="button" hlmTabsTrigger="checkResults">
              <ng-icon hlm name="bootstrapListStars" size="sm" />
              {{ 'general.checks' | transloco }}
            </button>
            <button type="button" hlmTabsTrigger="settings">
              <ng-icon hlm name="bootstrapGear" size="sm" />
              {{ 'general.settings' | transloco }}
            </button>
          </hlm-tabs-list>
        </div>
      </header>

      <div hlmTabsContent="overview">
        <pu-monitor-detail [monitorId]="_monitorId" />
      </div>
      <div hlmTabsContent="notifications">
        <section hlmCard>
          <div hlmCardContent>
            <pu-notification-list [monitorId]="_monitorId" />
          </div>
        </section>
      </div>
      <div hlmTabsContent="checkResults">
        <section hlmCard>
          <div hlmCardContent>
            <pu-check-result-list [monitorId]="_monitorId" />
          </div>
        </section>
      </div>
      <div hlmTabsContent="settings">
        <pu-monitor-edit-page isEditing />
      </div>
    </hlm-tabs>
  `,
  selector: 'monitor-detail-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorActionStore],
  imports: [
    MonitorCheckerDataValueLabelPipe,
    MonitorStatus,
    MonitorDetail,
    CheckResultList,
    NotificationList,
    MonitorEditPage,
    IsTeamAdmin,
    RouterLink,
    TranslocoPipe,
    HlmTabsImports,
    HlmIconImports,
    HlmCardImports,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmDropdownMenuImports,
    HlmBadgeImports,
    HlmSkeletonImports,
  ],
})
export class MonitorDetailPage {
  readonly monitorId = input.required<string>();

  protected readonly monitorDetailStore = inject(MonitorDetailStore);
  protected readonly monitorActionStore = inject(MonitorActionStore);

  readonly tab = linkedQueryParam<string>('tab', {
    defaultValue: 'overview',
  });

  constructor() {
    this.monitorDetailStore.loadMonitorById(this.monitorId);
  }
}
