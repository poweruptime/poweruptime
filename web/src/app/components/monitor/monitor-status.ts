import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {BackendType} from '@app/api';
import {MonitorStatusTextBackground} from '@app/directives';

@Component({
  template: `
    @let _status = status();
    <div
      class="flex h-8 items-center justify-center rounded-4xl px-3 text-lg"
      [monitor-status-text-background]="_status">
      <span>
        <ng-content>
          {{ _status }}
        </ng-content>
      </span>
    </div>
  `,
  selector: 'pu-monitor-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MonitorStatusTextBackground],
})
export class MonitorStatus {
  status = input.required<BackendType['MonitorResponse']['status']>();
}
