import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideSearch, lucideX} from '@ng-icons/lucide';
import {
  BrnAutocompleteAnchor,
  BrnAutocompleteClear,
  BrnAutocompleteInput,
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
  template: `
    <hlm-input-group class="w-auto" brnAutocompleteAnchor>
      <input
        #autocompleteInput="brnAutocompleteInput"
        [id]="inputId()"
        [placeholder]="placeholder()"
        [aria-invalid]="ariaInvalidOverride()"
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
  private static _id = 0;

  public readonly inputId = input<string>(`hlm-autocomplete-input-${HlmAutocompleteInput._id++}`);

  public readonly placeholder = input<string>('');

  public readonly showSearch = input<boolean, BooleanInput>(true, {transform: booleanAttribute});
  public readonly showClear = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  /** Manual override for aria-invalid. When not set, auto-detects from the parent autocomplete error state. */
  public readonly ariaInvalidOverride = input<boolean | undefined, BooleanInput>(undefined, {
    transform: (v: BooleanInput) => (v === '' || v === undefined ? undefined : booleanAttribute(v)),
    alias: 'aria-invalid',
  });
}
