import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {CheckResultList} from './check-result';
import {NotificationList} from './notification/notification-list';

@Component({
  template: `
    <hlm-tabs class="w-full" [tab]="ncTab()" (tabActivated)="ncTab.set($event)">
      <hlm-tabs-list class="h-auto p-0.5" aria-label="Notifications & check results tabs">
        <button class="gap-1.5" type="button" hlmTabsTrigger="notifications">
          <ng-icon class="text-[length:--spacing(4)]" name="bootstrapBell" />
          {{ 'general.notifications' | transloco }}
        </button>
        <button class="gap-1.5" type="button" hlmTabsTrigger="checkResults">
          <ng-icon class="text-[length:--spacing(4)]" name="bootstrapListStars" />
          {{ 'general.checks' | transloco }}
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
    NgIcon,
    HlmCardImports,
  ],
})
export class NotificationCheckResultCard {
  readonly monitorId = input<string>();
  readonly teamId = input<string>();

  readonly ncTab = linkedQueryParam<string>('nc_tab', {
    defaultValue: 'notifications',
    queryParamsHandling: 'replace',
  });
}
