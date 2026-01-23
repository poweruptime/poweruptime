import {Directive, booleanAttribute, input} from '@angular/core';

import {BackendType} from '@app/api';

import {MonitorStatusColor} from './monitor-status-color';
import {MonitorStatusText} from './monitor-status-text';

@Directive({
  standalone: true,
  selector: '[monitor-status-text-background]',
  host: {
    class: 'border border-1',
    '[class.font-bold]': '!mono()',
    '[class.font-mono]': 'mono()',
    // UP (green)
    '[class.border-emerald-200]': 'status() === "UP"',
    '[class.dark:border-emerald-800]': 'status() === "UP"',
    // DOWN (red)
    '[class.border-red-200]': 'status() === "DOWN"',
    '[class.dark:border-red-800]': 'status() === "DOWN"',
    // PENDING / MAINTENANCE / PAUSED (blue)
    '[class.border-blue-200]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
    '[class.dark:border-blue-800]': '["PENDING","MAINTENANCE","PAUSED"].includes(status())',
  },
  hostDirectives: [
    {
      directive: MonitorStatusText,
      inputs: ['monitor-status-text: monitor-status-text-background'],
    },
    {
      directive: MonitorStatusColor,
      inputs: ['monitor-status-color: monitor-status-text-background'],
    },
  ],
})
export class MonitorStatusTextBackground {
  status = input.required<BackendType['MonitorResponse']['status']>({
    alias: 'monitor-status-text-background',
  });

  mono = input(false, {transform: booleanAttribute});
}
