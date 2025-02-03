import {Directive, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[monitor-status-background]',
  host: {
    '[class.bg-green-500]': 'status() === "UP"',
    '[class.bg-red-500]': 'status() === "DOWN"',
    '[class.bg-blue-500]':
      'status() === "PAUSED" || status() === "MAINTENANCE" || status() === "PENDING"',
  },
})
export class MonitorStatusBackground {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-background',
  });
}
