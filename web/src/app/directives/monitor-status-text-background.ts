import {Directive, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[monitor-status-text-background]',
  host: {
    class: 'border border-1 font-bold',
    // UP (green)
    '[class.bg-emerald-50]': 'status() === "UP"',
    '[class.text-emerald-700]': 'status() === "UP"',
    '[class.border-emerald-200]': 'status() === "UP"',
    '[class.dark:bg-emerald-950]': 'status() === "UP"',
    '[class.dark:text-emerald-400]': 'status() === "UP"',
    '[class.dark:border-emerald-800]': 'status() === "UP"',
    // DOWN (red)
    '[class.bg-red-50]': 'status() === "DOWN"',
    '[class.text-red-700]': 'status() === "DOWN"',
    '[class.border-red-200]': 'status() === "DOWN"',
    '[class.dark:bg-red-950]': 'status() === "DOWN"',
    '[class.dark:text-red-400]': 'status() === "DOWN"',
    '[class.dark:border-red-800]': 'status() === "DOWN"',
    // PENDING / MAINTENANCE / PAUSED (blue)
    '[class.bg-blue-50]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.text-blue-700]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.border-blue-200]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.dark:bg-blue-950]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.dark:text-blue-400]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.dark:border-blue-800]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
  },
})
export class MonitorStatusTextBackground {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-text-background',
  });
}
