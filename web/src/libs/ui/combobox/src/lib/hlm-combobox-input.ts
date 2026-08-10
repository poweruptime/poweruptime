import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideChevronDown, lucideX} from '@ng-icons/lucide';
import {
  BrnComboboxAnchor,
  BrnComboboxImports,
  BrnComboboxPopoverTrigger,
} from '@spartan-ng/brain/combobox';
import {HlmInputGroup, HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {classes} from '@spartan-ng/helm/utils';

@Component({
  selector: 'hlm-combobox-input',
  imports: [HlmInputGroupImports, NgIcon, BrnComboboxImports, BrnComboboxPopoverTrigger],
  providers: [provideIcons({lucideChevronDown, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnComboboxAnchor, HlmInputGroup],
  template: `
    <input
      #comboboxInput="brnComboboxInput"
      [closeOnTriggerClick]="false"
      [id]="inputId()"
      [placeholder]="placeholder()"
      [forceInvalid]="forceInvalid()"
      [aria-invalid]="ariaInvalidOverride()"
      brnComboboxInput
      brnComboboxPopoverTrigger
      hlmInputGroupInput />

    <hlm-input-group-addon align="inline-end">
      @if (showTrigger()) {
        <button
          class="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
          [disabled]="comboboxInput.disabled()"
          [attr.aria-label]="triggerAriaLabel()"
          brnComboboxPopoverTrigger
          hlmInputGroupButton
          data-slot="input-group-button"
          size="icon-xs"
          variant="ghost">
          <ng-icon name="lucideChevronDown" />
        </button>
      }

      @if (showClear()) {
        <button
          *brnComboboxClear
          [disabled]="comboboxInput.disabled()"
          [attr.aria-label]="clearAriaLabel()"
          hlmInputGroupButton
          data-slot="combobox-clear"
          size="icon-xs"
          variant="ghost">
          <ng-icon name="lucideX" />
        </button>
      }
    </hlm-input-group-addon>

    <ng-content />
  `,
})
export class HlmComboboxInput {
  private static _id = 0;

  public readonly inputId = input<string>(`hlm-combobox-input-${HlmComboboxInput._id++}`);
  public readonly placeholder = input<string>('');

  public readonly showTrigger = input<boolean, BooleanInput>(true, {transform: booleanAttribute});
  public readonly showClear = input<boolean, BooleanInput>(false, {transform: booleanAttribute});
  public readonly forceInvalid = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  /** Accessible name for the icon-only popover trigger button. */
  public readonly triggerAriaLabel = input<string>('Toggle options');

  /** Accessible name for the icon-only clear button. */
  public readonly clearAriaLabel = input<string>('Clear selection');

  /** Manual override for aria-invalid. When not set, auto-detects from the parent combobox error state. */
  public readonly ariaInvalidOverride = input<boolean | undefined, BooleanInput>(undefined, {
    transform: (v: BooleanInput) => (v === '' || v === undefined ? undefined : booleanAttribute(v)),
    alias: 'aria-invalid',
  });

  constructor() {
    classes(() => 'w-auto');
  }
}
