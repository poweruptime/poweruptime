import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {NgIcon, provideIcons} from '@ng-icons/core';
import {lucideSearch, lucideX} from '@ng-icons/lucide';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';

import {BrnMentionAnchor, BrnMentionClear, BrnMentionInput, BrnMentionInputWrapper} from '../brain';

@Component({
  selector: 'hlm-mention-input',
  imports: [HlmInputGroupImports, NgIcon, BrnMentionAnchor, BrnMentionClear, BrnMentionInput],
  providers: [provideIcons({lucideSearch, lucideX})],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnMentionInputWrapper],
  template: `
    <hlm-input-group class="w-auto" brnMentionAnchor>
      <input
        #mentionInput="brnMentionInput"
        [placeholder]="placeholder()"
        [attr.aria-invalid]="ariaInvalid() ? 'true' : null"
        brnMentionInput
        hlmInputGroupInput />

      @if (showSearch()) {
        <hlm-input-group-addon>
          <ng-icon [class.opacity-50]="mentionInput.disabled()" name="lucideSearch" />
        </hlm-input-group-addon>
      }

      @if (showClear()) {
        <hlm-input-group-addon align="inline-end">
          <button
            *brnMentionClear
            [disabled]="mentionInput.disabled()"
            hlmInputGroupButton
            data-slot="mention-clear"
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
export class HlmMentionInput {
  public readonly placeholder = input<string>('');

  public readonly showSearch = input<boolean, BooleanInput>(true, {transform: booleanAttribute});
  public readonly showClear = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  // TODO input and input-group styles need to support aria-invalid directly
  public readonly ariaInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'aria-invalid',
  });
}
