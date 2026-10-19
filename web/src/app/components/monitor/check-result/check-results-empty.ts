import {ChangeDetectionStrategy, Component} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';

@Component({
  template: `
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon class="text-[length:--spacing(6)]" name="bootstrapListStars" />
        </div>
        <div hlmEmptyTitle>{{ 'checkResult.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'checkResult.list.empty.description' | transloco }}</div>
      </div>
    </div>
  `,
  selector: 'pu-check-results-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, HlmEmptyImports, TranslocoPipe],
})
export class CheckResultsEmpty {}
