import {Directive, input} from '@angular/core';

@Directive({
  selector: '[puAlert]',
  host: {
    class: 'rounded-lg p-4 text-sm dark:bg-gray-800',
    role: 'alert',
    '[class.bg-blue-100]': 'type() === "INFO"',
    '[class.text-blue-800]': 'type() === "INFO"',
    '[class.dark:text-blue-400]': 'type() === "INFO"',
    '[class.bg-red-100]': 'type() === "WARN"',
    '[class.text-red-800]': 'type() === "WARN"',
    '[class.dark:text-red-400]': 'type() === "WARN"',
  },
})
export class AlertDirective {
  type = input.required<'INFO' | 'WARN'>();
}
