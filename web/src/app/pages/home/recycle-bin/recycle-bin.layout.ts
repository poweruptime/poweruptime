import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {RecycleBinMonitorList} from '@app/components/monitor';
import {RecycleBinNotificationMethodPage} from '@app/components/notification-method';
import {RecycleBinStatusPageList} from '@app/components/status-page';

@Component({
  template: `
    <hlm-tabs class="w-full" [tab]="tab()" (tabActivated)="tab.set($event)">
      <hlm-tabs-list class="h-auto p-0.5" aria-label="Notifications & check results tabs">
        <button class="gap-1.5" type="button" hlmTabsTrigger="monitors">
          <ng-icon hlm name="lucideScreenShare" size="sm" />
          {{ 'general.monitors' | transloco }}
        </button>
        <button class="gap-1.5" type="button" hlmTabsTrigger="notificationMethods">
          <ng-icon hlm name="bootstrapBell" size="sm" />
          {{ 'general.notificationMethods' | transloco }}
        </button>
        <button class="gap-1.5" type="button" hlmTabsTrigger="statusPages">
          <ng-icon hlm name="bootstrapChatLeftQuote" size="sm" />
          {{ 'general.statusPages' | transloco }}
        </button>
      </hlm-tabs-list>
      @let _teamId = teamId();
      <div hlmTabsContent="monitors">
        <pu-recycle-bin-monitor-list [teamId]="_teamId" />
      </div>
      <div hlmTabsContent="notificationMethods">
        <pu-recycle-bin-notification-method-list [teamId]="_teamId" />
      </div>
      <div hlmTabsContent="statusPages">
        <pu-recycle-bin-status-page-list [teamId]="_teamId" />
      </div>
    </hlm-tabs>
  `,
  selector: 'pu-recycle-bin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RecycleBinMonitorList,
    RecycleBinNotificationMethodPage,
    RecycleBinStatusPageList,
    TranslocoPipe,
    HlmIconImports,
    HlmTabsImports,
  ],
})
export class RecycleBinLayout {
  readonly teamId = input.required<string>();

  readonly tab = linkedQueryParam<string>('tab', {
    defaultValue: 'monitors',
    queryParamsHandling: 'replace',
  });
}
