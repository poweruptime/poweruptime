import {Directive} from '@angular/core';

import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionContent} from './brn-mention-content';

@Directive({
  selector: '[hlmMentionContent]',
  hostDirectives: [BrnMentionContent],
})
export class HlmMentionContent {
  constructor() {
    classes(
      () =>
        'group/mention-content bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/10 max-h-72 w-(--brn-mention-width) min-w-36 overflow-hidden rounded-md p-0 shadow-md ring-1 duration-100',
    );
  }
}
