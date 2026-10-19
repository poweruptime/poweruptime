import {ChangeDetectionStrategy, Component} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';

@Component({
  template: `
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon class="text-[length:--spacing(6)]" name="bootstrapBell" />
        </div>
        <div hlmEmptyTitle>{{ 'notificationMethod.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'notificationMethod.list.empty.description' | transloco }}</div>
      </div>
      <div hlmEmptyContent>
        <div class="flex flex-wrap justify-center gap-2 md:flex-nowrap">
          <a hlmBtn routerLink="new">
            <ng-icon class="text-[length:--spacing(4)]" name="bootstrapPlusCircle" />
            {{ 'notificationMethod.list.empty.createNotificationMethod' | transloco }}
          </a>
          <a hlmBtn routerLink="../m" variant="outline">
            {{ 'notificationMethod.list.empty.openMonitors' | transloco }}
          </a>
        </div>
      </div>
    </div>
  `,
  selector: 'pu-notification-methods-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmEmptyImports, HlmButtonImports, TranslocoPipe, RouterLink],
})
export class NotificationMethodsEmpty {}
