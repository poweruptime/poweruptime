import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionStatus} from '../brain';

@Directive({
  selector: '[hlmMentionStatus],hlm-mention-status',
  hostDirectives: [BrnMentionStatus],
  host: {
    'data-slot': 'mention-status',
  },
})
export class HlmMentionStatus {
  constructor() {
    classes(
      () =>
        'text-muted-foreground flex w-full items-center justify-center gap-2 px-3 py-2 text-center text-sm',
    );
  }
}
