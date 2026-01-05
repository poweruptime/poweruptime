import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
} from '@angular/core';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideChevronDown} from '@ng-icons/lucide';
import {BrnSelect, BrnSelectTrigger} from '@spartan-ng/brain/select';
import {HlmIcon} from '@spartan-ng/helm/icon';
import {hlm} from '@spartan-ng/helm/utils';
import {cva} from 'class-variance-authority';
import type {ClassValue} from 'clsx';

export const selectTriggerVariants = cva(
  `border-input [&>ng-icon:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&>ng-icon]:pointer-events-none [&>ng-icon]:size-4 [&>ng-icon]:shrink-0`,
  {
    variants: {
      error: {
        auto: '[&.ng-invalid.ng-touched]:text-destructive [&.ng-invalid.ng-touched]:border-destructive [&.ng-invalid.ng-touched]:focus-visible:ring-destructive/20 dark:[&.ng-invalid.ng-touched]:focus-visible:ring-destructive/40',
        true: 'text-destructive border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
      },
    },
    defaultVariants: {
      error: 'auto',
    },
  },
);

@Component({
  selector: 'hlm-select-trigger',
  imports: [BrnSelectTrigger, NgIcon, HlmIcon],
  providers: [provideIcons({lucideChevronDown})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #button
      [class]="_computedClass()"
      [attr.data-size]="size()"
      hlmInput
      brnSelectTrigger
      type="button">
      <ng-content />
      @if (_icon()) {
        <ng-content select="ng-icon" />
      } @else {
        <ng-icon class="ml-2 flex-none" hlm size="sm" name="lucideChevronDown" />
      }
    </button>
  `,
})
export class HlmSelectTrigger {
  protected readonly _icon = contentChild(HlmIcon);

  protected readonly _brnSelect = inject(BrnSelect, {optional: true});

  public readonly userClass = input<ClassValue>('', {alias: 'class'});

  public readonly size = input<'default' | 'sm'>('default');

  protected readonly _computedClass = computed(() =>
    hlm(selectTriggerVariants({error: this._brnSelect?.errorState()}), this.userClass()),
  );
}
