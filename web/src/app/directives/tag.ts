import {Directive, booleanAttribute, input} from '@angular/core';

import {BackendType} from '@app/api';

@Directive({
  standalone: true,
  selector: '[pu-tag]',
  host: {
    class:
      'inline-flex items-center rounded-md px-2 py-1 font-medium ring-1 ring-inset transform transition duration-150 ease-in-out',
    '[class.hover:scale-105]': 'clickable()',

    '[class.!bg-red-50]': 'variant() === "RED"',
    '[class.text-red-700]': 'variant() === "RED"',
    '[class.ring-red-600/10]': 'variant() === "RED"',
    '[class.dark:!bg-red-950]': 'variant() === "RED"',
    '[class.dark:text-red-300]': 'variant() === "RED"',
    '[class.dark:ring-red-300/20]': 'variant() === "RED"',

    '[class.!bg-blue-50]': 'variant() === "BLUE"',
    '[class.text-blue-700]': 'variant() === "BLUE"',
    '[class.ring-blue-600/10]': 'variant() === "BLUE"',
    '[class.dark:!bg-blue-950]': 'variant() === "BLUE"',
    '[class.dark:text-blue-300]': 'variant() === "BLUE"',
    '[class.dark:ring-blue-300/20]': 'variant() === "BLUE"',

    '[class.!bg-green-50]': 'variant() === "GREEN"',
    '[class.text-green-700]': 'variant() === "GREEN"',
    '[class.ring-green-600/10]': 'variant() === "GREEN"',
    '[class.dark:!bg-green-950]': 'variant() === "GREEN"',
    '[class.dark:text-green-300]': 'variant() === "GREEN"',
    '[class.dark:ring-green-300/20]': 'variant() === "GREEN"',

    '[class.!bg-pink-50]': 'variant() === "PINK"',
    '[class.text-pink-700]': 'variant() === "PINK"',
    '[class.ring-pink-600/10]': 'variant() === "PINK"',
    '[class.dark:!bg-pink-950]': 'variant() === "PINK"',
    '[class.dark:text-pink-300]': 'variant() === "PINK"',
    '[class.dark:ring-pink-300/20]': 'variant() === "PINK"',

    '[class.!bg-yellow-50]': 'variant() === "YELLOW"',
    '[class.text-yellow-600]': 'variant() === "YELLOW"',
    '[class.ring-yellow-700/10]': 'variant() === "YELLOW"',
    '[class.dark:!bg-yellow-950]': 'variant() === "YELLOW"',
    '[class.dark:text-yellow-300]': 'variant() === "YELLOW"',
    '[class.dark:ring-yellow-300/20]': 'variant() === "YELLOW"',

    '[class.text-neutral-900]': 'variant() === "GHOST"',
    '[class.ring-neutral-600/10]': 'variant() === "GHOST"',
    '[class.dark:text-neutral-100]': 'variant() === "GHOST"',
    '[class.dark:ring-neutral-300/20]': 'variant() === "GHOST"',
  },
})
export class Tag {
  variant = input.required<BackendType['TagDto']['variant'] | 'GHOST'>({
    alias: 'pu-tag',
  });
  clickable = input(false, {transform: booleanAttribute});
}
