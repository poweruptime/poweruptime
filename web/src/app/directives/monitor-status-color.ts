import {Directive, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[monitor-status-color]',
  host: {
    '[class.dark:text-green-500]': 'status() === "UP"',
    '[class.text-emerald-700]': 'status() === "UP"',
    '[class.dark:text-red-500]': 'status() === "DOWN"',
    '[class.text-red-700]': 'status() === "DOWN"',
    '[class.text-blue-500]':
      'status() === "PAUSED" || status() === "MAINTENANCE" || status() === "PENDING"',
  },
})
export class MonitorStatusColor {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-color',
  });
}
