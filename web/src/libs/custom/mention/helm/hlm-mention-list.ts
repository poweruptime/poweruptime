import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionList} from '../brain';

@Directive({
  selector: '[hlmMentionList]',
  hostDirectives: [{directive: BrnMentionList, inputs: ['id']}],
  host: {
    'data-slot': 'mention-list',
  },
})
export class HlmMentionList {
  constructor() {
    classes(
      () =>
        'no-scrollbar max-h-[calc(--spacing(72)---spacing(9))] scroll-py-1 overflow-y-auto overscroll-contain p-1 data-empty:p-0',
    );
  }
}
