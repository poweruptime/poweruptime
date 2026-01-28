import {Directive} from '@angular/core';

@Directive({
  selector: '[brnMentionEmpty]',
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
})
export class BrnMentionEmpty {}
