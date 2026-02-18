import {Directive} from '@angular/core';

import {BrnPopoverContent} from '@spartan-ng/brain/popover';

@Directive({
  selector: '[hlmMentionPortal]',
  hostDirectives: [{directive: BrnPopoverContent, inputs: ['context', 'class']}],
})
export class HlmMentionPortal {}
