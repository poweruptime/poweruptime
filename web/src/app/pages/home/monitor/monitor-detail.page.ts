import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmButtonGroupImports} from '@spartan-ng/helm/button-group';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {CheckResultList, NotificationList} from '@app/components/monitor';
import {MonitorDetail} from '@app/components/monitor/detail';
import {IsTeamAdmin} from '@app/directives';
import {MonitorActionStore, MonitorDetailStore} from '@app/services';

import {MonitorEditPage} from './monitor-edit.page';

@Component({
  template: `
    @let _monitorId = monitorId();

    <hlm-tabs class="w-full" [tab]="tab()" (tabActivated)="tab.set($event)">
      <div class="flex flex-wrap justify-end gap-4 md:justify-between">
        <hlm-tabs-list class="h-auto p-0.5" aria-label="Notifications & check results tabs">
          <button class="gap-1.5" type="button" hlmTabsTrigger="overview">
            <ng-icon hlm name="lucideLayoutDashboard" size="sm" />
            {{ 'general.overview' | transloco }}
          </button>
          <button class="gap-1.5" type="button" hlmTabsTrigger="notifications">
            <ng-icon hlm name="bootstrapBell" size="sm" />
            {{ 'general.notifications' | transloco }}
          </button>
          <button class="gap-1.5" type="button" hlmTabsTrigger="checkResults">
            <ng-icon hlm name="bootstrapListStars" size="sm" />
            {{ 'general.checks' | transloco }}
          </button>
          <button class="gap-1.5" type="button" hlmTabsTrigger="settings">
            <ng-icon hlm name="bootstrapGear" size="sm" />
            {{ 'general.settings' | transloco }}
          </button>
        </hlm-tabs-list>
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
    TranslocoPipe,
    MonitorDetail,
    CheckResultList,
    NotificationList,
    MonitorEditPage,
    IsTeamAdmin,
    HlmTabsImports,
    HlmIconImports,
    HlmCardImports,
    HlmButtonImports,
    HlmButtonGroupImports,
    HlmDropdownMenuImports,
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
