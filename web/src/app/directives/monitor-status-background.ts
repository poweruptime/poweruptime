import {Directive, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[monitor-status-background]',
  host: {
    class: 'text-white dark:text-black',
    // UP (green)
    '[class.bg-emerald-700]': 'status() === "UP"',
    '[class.dark:bg-emerald-600]': 'status() === "UP"',
    // DOWN (red)
    '[class.bg-red-600]': 'status() === "DOWN"',
    '[class.dark:bg-red-400]': 'status() === "DOWN"',
    // PENDING / MAINTENANCE / PAUSED (blue)
    '[class.bg-blue-700]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.dark:bg-blue-400]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
  },
})
export class MonitorStatusBackground {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-background',
  });
}
