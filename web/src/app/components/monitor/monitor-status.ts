import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BackendType} from '@app/api';
import {MonitorStatusBackground} from '@app/directives';

@Component({
  template: `
    @let _status = status();
    <div class="relative flex h-14">
      <span
        class="absolute inline-flex h-full w-full rounded-md opacity-75"
        [class.ping]="animate()"
        [class.bg-green-400]="_status === 'UP'"
        [class.bg-red-400]="_status === 'DOWN'"
        [class.bg-blue-500]="
          _status === 'PAUSED' || _status === 'MAINTENANCE' || _status === 'PENDING'
        "></span>
      <div
        class="relative flex h-14 items-center justify-center rounded-md p-3"
        [monitor-status-background]="_status">
        <span class="text-2xl font-bold">{{ _status }}</span>
      </div>
    </div>
  `,
  styles: `
    .ping {
      animation: ping2 3s cubic-bezier(0, 0, 0.2, 1) infinite;
    }

    @keyframes ping2 {
      75%,
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }
  `,
  selector: 'pu-monitor-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MonitorStatusBackground],
})
export class MonitorStatus {
  status = input.required<BackendType['MonitorResponse']['status']>();

  animate = input(false, {transform: booleanAttribute});
}
