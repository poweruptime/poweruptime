import {ChangeDetectionStrategy, Component} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';

@Component({
  template: `
    <div hlmEmpty>
      <div hlmEmptyHeader>
        <div hlmEmptyMedia variant="icon">
          <ng-icon hlm name="bootstrapListStars" />
        </div>
        <div hlmEmptyTitle>{{ 'checkResult.list.empty.title' | transloco }}</div>
        <div hlmEmptyDescription>{{ 'checkResult.list.empty.description' | transloco }}</div>
      </div>
    </div>
  `,
  selector: 'pu-check-results-empty',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmIconImports, HlmEmptyImports, TranslocoPipe],
})
export class CheckResultsEmpty {}
