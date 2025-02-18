import {Directive, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[monitor-status-background]',
  host: {
    class: 'text-white dark:text-black',
    '[class.dark:bg-green-500]': 'status() === "UP"',
    '[class.bg-emerald-700]': 'status() === "UP"',
    '[class.dark:bg-red-500]': 'status() === "DOWN"',
    '[class.bg-red-700]': 'status() === "DOWN"',
    '[class.bg-blue-500]':
      'status() === "PAUSED" || status() === "MAINTENANCE" || status() === "PENDING"',
  },
})
export class MonitorStatusBackground {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-background',
  });
}
