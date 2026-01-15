import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideChevronDown, lucideX} from '@ng-icons/lucide';
import {
  BrnComboboxImports,
  BrnComboboxInputWrapper,
  BrnComboboxPopoverTrigger,
} from '@spartan-ng/brain/combobox';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';

@Component({
  selector: 'hlm-combobox-input',
  imports: [HlmInputGroupImports, NgIcon, BrnComboboxImports, BrnComboboxPopoverTrigger],
  providers: [provideIcons({lucideChevronDown, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnComboboxInputWrapper],
  template: `
    <hlm-input-group class="w-auto" brnComboboxAnchor>
      <input
        #comboboxInput="brnComboboxInput"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="ariaInvalid() ? 'true' : null"
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
  public readonly placeholder = input<string>('');

  public readonly showTrigger = input<boolean, BooleanInput>(true, {transform: booleanAttribute});
  public readonly showClear = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  // TODO input and input-group styles need to support aria-invalid directly
  public readonly ariaInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'aria-invalid',
  });
}
