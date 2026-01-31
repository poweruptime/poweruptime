import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionGroup} from '../brain';

@Directive({
  selector: '[hlmMentionGroup]',
  hostDirectives: [BrnMentionGroup],
  host: {
    'data-slot': 'mention-group',
  },
})
export class HlmMentionGroup {
  constructor() {
    classes(() => 'data-hidden:hidden');
  }
}
