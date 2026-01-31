import {Directive} from '@angular/core';

@Directive({
  selector: '[brnMentionStatus]',
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
})
export class BrnMentionStatus {}
