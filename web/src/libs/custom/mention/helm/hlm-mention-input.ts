import {ChangeDetectionStrategy, Component, booleanAttribute, input} from '@angular/core';

import {BooleanInput} from '@angular/cdk/coercion';

import {HlmTextareaImports} from '@spartan-ng/helm/textarea';

import {BrnMentionAnchor, BrnMentionInput, BrnMentionInputWrapper} from '../brain';

@Component({
  selector: 'hlm-mention-input',
  imports: [BrnMentionInput, HlmTextareaImports, BrnMentionAnchor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [BrnMentionInputWrapper],
  template: `
    <textarea
      class="w-full"
      #mentionInput="brnMentionInput"
      [placeholder]="placeholder()"
      [attr.aria-invalid]="ariaInvalid() ? 'true' : null"
      brnMentionInput
      brnMentionAnchor
      hlmTextarea></textarea>

    <ng-content />
  `,
})
export class HlmMentionInput {
  public readonly placeholder = input<string>('');

  // TODO input and input-group styles need to support aria-invalid directly
  public readonly ariaInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
    alias: 'aria-invalid',
  });
}
