import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';

@Component({
  template: `
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon hlm name="bootstrapBell" />
        </div>
        <div hlmEmptyTitle>{{ 'notification.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'notification.list.empty.description' | transloco }}</div>
      </div>
      <div hlmEmptyContent>
        <div class="flex flex-wrap justify-center gap-2 md:flex-nowrap">
          <a hlmBtn routerLink="../notification-methods">
            {{ 'notification.list.empty.manageNotificationMethods' | transloco }}
          </a>
          <a
            [queryParams]="{nc_tab: 'checkResults'}"
            hlmBtn
            routerLink="."
            queryParamsHandling="merge"
            variant="outline">
            {{ 'notification.list.empty.openCheckResults' | transloco }}
          </a>
        </div>
      </div>
      <a
        class="text-muted-foreground"
        routerLink="../notification-methods/new"
        hlmBtn
        variant="link"
        size="sm">
        {{ 'notification.list.empty.createNotificationMethod' | transloco }}
        <ng-icon hlm name="bootstrapPlusCircle" size="sm" />
      </a>
    </div>
  `,
  selector: 'pu-notifications-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmIconImports, HlmEmptyImports, HlmButtonImports, TranslocoPipe, RouterLink],
})
export class NotificationsEmpty {}
