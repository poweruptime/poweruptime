import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionEmpty} from '../brain';

@Directive({
  selector: '[hlmMentionEmpty],hlm-mention-empty',
  hostDirectives: [BrnMentionEmpty],
  host: {
    'data-slot': 'mention-empty',
  },
})
export class HlmMentionEmpty {
  constructor() {
    classes(
      () =>
        'text-muted-foreground hidden w-full items-center justify-center gap-2 py-2 text-center text-sm group-data-empty/mention-content:flex',
    );
  }
}
