import {Directive, booleanAttribute, input} from '@angular/core';

export type TagVariant = 'red' | 'blue' | 'green' | 'pink' | 'yellow';

@Directive({
  standalone: true,
  selector: '[pu-tag]',
  host: {
    class:
      'inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium  ring-1 ring-inset transform transition duration-150 ease-in-out',
    '[class.hover:scale-105]': 'clickable()',

    '[class.bg-red-50]': 'variant() === "red"',
    '[class.text-red-700]': 'variant() === "red"',
    '[class.ring-red-600/10]': 'variant() === "red"',
    '[class.dark:bg-red-950]': 'variant() === "red"',
    '[class.dark:text-red-300]': 'variant() === "red"',
    '[class.dark:ring-red-300/20]': 'variant() === "red"',

    '[class.bg-blue-50]': 'variant() === "blue"',
    '[class.text-blue-700]': 'variant() === "blue"',
    '[class.ring-blue-700/10]': 'variant() === "blue"',
    '[class.dark:bg-blue-950]': 'variant() === "blue"',
    '[class.dark:text-blue-300]': 'variant() === "blue"',
    '[class.dark:ring-blue-300/20]': 'variant() === "blue"',

    '[class.bg-green-50]': 'variant() === "green"',
    '[class.text-green-700]': 'variant() === "green"',
    '[class.ring-green-700/10]': 'variant() === "green"',
    '[class.dark:bg-green-950]': 'variant() === "green"',
    '[class.dark:text-green-300]': 'variant() === "green"',
    '[class.dark:ring-green-300/20]': 'variant() === "green"',

    '[class.bg-pink-50]': 'variant() === "pink"',
    '[class.text-pink-700]': 'variant() === "pink"',
    '[class.ring-pink-700/10]': 'variant() === "pink"',
    '[class.dark:bg-pink-950]': 'variant() === "pink"',
    '[class.dark:text-pink-300]': 'variant() === "pink"',
    '[class.dark:ring-pink-300/20]': 'variant() === "pink"',

    '[class.bg-yellow-50]': 'variant() === "yellow"',
    '[class.text-yellow-700]': 'variant() === "yellow"',
    '[class.ring-yellow-700/10]': 'variant() === "yellow"',
    '[class.dark:bg-yellow-950]': 'variant() === "yellow"',
    '[class.dark:text-yellow-300]': 'variant() === "yellow"',
    '[class.dark:ring-yellow-300/20]': 'variant() === "yellow"',
  },
})
export class Tag {
  variant = input.required<TagVariant>({
    alias: 'pu-tag',
  });

  clickable = input(false, {transform: booleanAttribute});
}
