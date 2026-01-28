import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionLabel} from '../brain';

@Directive({
  selector: '[hlmMentionLabel]',
  hostDirectives: [{directive: BrnMentionLabel, inputs: ['id']}],
  host: {
    'data-slot': 'mention-label',
  },
})
export class HlmMentionLabel {
  constructor() {
    classes(() => 'text-muted-foreground px-2 py-1.5 text-xs');
  }
}
