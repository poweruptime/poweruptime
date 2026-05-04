import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideChevronDown, lucideX} from '@ng-icons/lucide';
import {BrnComboboxImports, BrnComboboxPopoverTrigger} from '@spartan-ng/brain/combobox';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';

@Component({
  selector: 'hlm-combobox-input',
  imports: [HlmInputGroupImports, NgIcon, BrnComboboxImports, BrnComboboxPopoverTrigger],
  providers: [provideIcons({lucideChevronDown, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-input-group class="w-auto" brnComboboxAnchor>
      <input
        #comboboxInput="brnComboboxInput"
        [id]="inputId()"
        [placeholder]="placeholder()"
        [aria-invalid]="ariaInvalidOverride()"
        brnComboboxInput
        brnComboboxPopoverTrigger
        hlmInputGroupInput />

      <hlm-input-group-addon align="inline-end">
        @if (showTrigger()) {
          <button
            class="group-has-data-[slot=combobox-clear]/input-group:hidden data-pressed:bg-transparent"
            [disabled]="comboboxInput.disabled()"
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
            hlmInputGroupButton
            data-slot="combobox-clear"
            size="icon-xs"
            variant="ghost">
            <ng-icon name="lucideX" />
          </button>
        }
      </hlm-input-group-addon>

      <ng-content />
    </hlm-input-group>
  `,
})
export class HlmComboboxInput {
  private static _id = 0;

  public readonly inputId = input<string>(`hlm-combobox-input-${HlmComboboxInput._id++}`);
  public readonly placeholder = input<string>('');

  public readonly showTrigger = input<boolean, BooleanInput>(true, {transform: booleanAttribute});
  public readonly showClear = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  /** Manual override for aria-invalid. When not set, auto-detects from the parent combobox error state. */
  public readonly ariaInvalidOverride = input<boolean | undefined, BooleanInput>(undefined, {
    transform: (v: BooleanInput) => (v === '' || v === undefined ? undefined : booleanAttribute(v)),
    alias: 'aria-invalid',
  });
}
