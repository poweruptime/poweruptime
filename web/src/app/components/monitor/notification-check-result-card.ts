import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';

import {CheckResultList} from './check-result';
import {NotificationList} from './notification/notification-list';

@Component({
  template: `
    <hlm-tabs class="w-full" [tab]="ncTab()" (tabActivated)="ncTab.set($event)">
      <hlm-tabs-list class="h-auto p-0.5" aria-label="Notifications & check results tabs">
        <button class="gap-1.5" hlmTabsTrigger="notifications">
          <ng-icon hlm name="bootstrapBell" size="sm" />
          {{ 'general.notifications' | transloco }}
        </button>
        <button class="gap-1.5" hlmTabsTrigger="checkResults">
          <ng-icon hlm name="bootstrapListStars" size="sm" />
          {{ 'checkResult.list.title' | transloco }}
        </button>
      </hlm-tabs-list>
      <div hlmTabsContent="notifications">
        <section hlmCard>
          <div hlmCardContent>
            <pu-notification-list [teamId]="teamId()" [monitorId]="monitorId()" />
          </div>
        </section>
      </div>
      <div hlmTabsContent="checkResults">
        <section hlmCard>
          <div hlmCardContent>
            <pu-check-result-list [teamId]="teamId()" [monitorId]="monitorId()" />
          </div>
        </section>
      </div>
    </hlm-tabs>
  `,

  selector: 'pu-notification-check-result-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CheckResultList,
    NotificationList,
    TranslocoPipe,
    HlmTabsImports,
    HlmIconImports,
    HlmCardImports,
  ],
})
export class NotificationCheckResultCard {
  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  readonly ncTab = linkedQueryParam<string>('nc_tab', {
    defaultValue: 'notifications',
  });
}
