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
          <ng-icon class="text-[length:--spacing(6)]" name="bootstrapChatLeftQuote" />
        </div>
        <div hlmEmptyTitle>{{ 'statusPage.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'statusPage.list.empty.description' | transloco }}</div>
      </div>
      <div hlmEmptyContent>
        <div class="flex gap-2">
          <a hlmBtn routerLink="new">
            <ng-icon class="text-[length:--spacing(4)]" name="bootstrapPlusCircle" />
            {{ 'statusPage.list.empty.createStatusPage' | transloco }}
          </a>
          <a hlmBtn routerLink="../m" variant="outline">
            {{ 'statusPage.list.empty.openMonitors' | transloco }}
          </a>
        </div>
      </div>
    </div>
  `,
  selector: 'pu-status-pages-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmEmptyImports, HlmButtonImports, TranslocoPipe, RouterLink],
})
export class StatusPagesEmpty {}
