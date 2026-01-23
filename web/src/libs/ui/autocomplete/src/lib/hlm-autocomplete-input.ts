import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideSearch, lucideX} from '@ng-icons/lucide';
import {
  BrnAutocompleteAnchor,
  BrnAutocompleteClear,
  BrnAutocompleteInput,
  BrnAutocompleteInputWrapper,
} from '@spartan-ng/brain/autocomplete';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';

@Component({
  selector: 'hlm-autocomplete-input',
  imports: [
    HlmInputGroupImports,
    NgIcon,
    BrnAutocompleteAnchor,
    BrnAutocompleteClear,
    BrnAutocompleteInput,
  ],
  providers: [provideIcons({lucideSearch, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnAutocompleteInputWrapper],
  template: `
    <hlm-input-group class="w-auto" brnAutocompleteAnchor>
      <input
        #autocompleteInput="brnAutocompleteInput"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="ariaInvalid() ? 'true' : null"
        brnAutocompleteInput
        hlmInputGroupInput />

      @if (showSearch()) {
        <hlm-input-group-addon>
          <ng-icon [class.opacity-50]="autocompleteInput.disabled()" name="lucideSearch" />
        </hlm-input-group-addon>
      }

      @if (showClear()) {
        <hlm-input-group-addon align="inline-end">
          <button
            *brnAutocompleteClear
            [disabled]="autocompleteInput.disabled()"
            hlmInputGroupButton
            data-slot="autocomplete-clear"
            size="icon-xs"
            variant="ghost">
            <ng-icon name="lucideX" />
          </button>
        </hlm-input-group-addon>
      }
      <ng-content />
    </hlm-input-group>
  `,
})
export class HlmAutocompleteInput {
  public readonly placeholder = input<string>('');

  public readonly showSearch = input<boolean, BooleanInput>(true, {transform: booleanAttribute});
  public readonly showClear = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  // TODO input and input-group styles need to support aria-invalid directly
  public readonly ariaInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'aria-invalid',
  });
}
