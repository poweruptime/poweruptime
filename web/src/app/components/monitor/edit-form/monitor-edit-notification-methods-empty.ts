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
        <div hlmEmptyTitle>{{ 'notificationMethod.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'notificationMethod.list.empty.description' | transloco }}</div>
      </div>
      <div hlmEmptyContent>
        <div class="flex gap-2">
          <a hlmBtn routerLink="../../notification-methods/new">
            <ng-icon hlm name="bootstrapPlusCircle" size="sm" />
            {{ 'notificationMethod.list.empty.createNotificationMethod' | transloco }}
          </a>
        </div>
      </div>
    </div>
  `,
  selector: 'pu-monitor-edit-notification-methods-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmIconImports, HlmEmptyImports, HlmButtonImports, TranslocoPipe, RouterLink],
})
export class MonitorEditNotificationMethodsEmpty {}
