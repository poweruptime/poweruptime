import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {MonitorDataType} from '@app/api';
import {MonitorCheckerDataValueLabelPipe} from '@app/pipes';

@Component({
  template: `
    <section class="w-full" hlmCard>
      @let typeValue = type();
      <div hlmCardHeader>
        <div class="flex items-center gap-2">
          <ng-icon name="lucideServer" />
          <h3 hlmCardTitle>
            @if (typeValue !== '') {
              {{ typeValue | monitorCheckerDataValueLabel | transloco }}
              {{ 'general.configuration' | transloco }}
            } @else {
              {{ 'monitor.edit.selectTypeToContinue' | transloco }}
            }
          </h3>
        </div>
      </div>
      <div hlmCardContent>
        <ng-content />
      </div>
    </section>
  `,
  selector: 'pu-monitor-edit-form-data-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCardImports, HlmIconImports, TranslocoPipe, MonitorCheckerDataValueLabelPipe],
})
export class MonitorEditFormDataCard {
  type = input<MonitorDataType | ''>('');
}
