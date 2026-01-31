import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionSeparator} from '../brain';

@Directive({
  selector: '[hlmMentionSeparator]',
  hostDirectives: [{directive: BrnMentionSeparator, inputs: ['orientation']}],
  host: {
    'data-slot': 'mention-separator',
  },
})
export class HlmMentionSeparator {
  constructor() {
    classes(() => 'bg-border -mx-1 my-1 h-px');
  }
}
