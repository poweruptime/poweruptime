import {Directive, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[monitor-status-text]',
  host: {
    // UP (green)
    '[class.text-emerald-700]': 'status() === "UP"',
    '[class.dark:text-emerald-400]': 'status() === "UP"',
    // DOWN (red)
    '[class.text-red-700]': 'status() === "DOWN"',
    '[class.dark:text-red-400]': 'status() === "DOWN"',
    // PENDING / MAINTENANCE / PAUSED (blue)
    '[class.text-blue-700]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.dark:text-blue-400]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
  },
})
export class MonitorStatusText {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-text',
  });
}
