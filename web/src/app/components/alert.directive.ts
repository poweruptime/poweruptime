import {Directive, input} from '@angular/core';

@Directive({
  selector: '[puAlert]',
  host: {
    class: 'mb-4 rounded-lg p-4 text-sm dark:bg-gray-800',
    role: 'alert',
    '[class.bg-blue-50]': 'type() === "INFO"',
    '[class.text-blue-800]': 'type() === "INFO"',
    '[class.dark:text-blue-400]': 'type() === "INFO"',
    '[class.bg-red-50]': 'type() === "WARN"',
    '[class.text-red-800]': 'type() === "WARN"',
    '[class.dark:text-red-400]': 'type() === "WARN"',
  },
})
export class AlertDirective {
  type = input.required<'INFO' | 'WARN'>();
}
