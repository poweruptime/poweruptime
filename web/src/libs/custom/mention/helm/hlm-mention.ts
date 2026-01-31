import {Directive} from '@angular/core';

import {provideBrnDialogDefaultOptions} from '@spartan-ng/brain/dialog';
import {BrnPopover, provideBrnPopoverConfig} from '@spartan-ng/brain/popover';
import {classes} from '@spartan-ng/helm/utils';

import {BrnMention} from '../brain';

@Directive({
  selector: '[hlmMention],hlm-mention',
  providers: [
    provideBrnPopoverConfig({
      align: 'start',
      sideOffset: 6,
    }),
    provideBrnDialogDefaultOptions({
      autoFocus: 'first-heading',
    }),
  ],
  hostDirectives: [
    {
      directive: BrnMention,
      inputs: ['disabled', 'value', 'search'],
      outputs: ['valueChange', 'searchChange'],
    },
    {
      directive: BrnPopover,
      inputs: [
        'align',
        'autoFocus',
        'closeDelay',
        'closeOnOutsidePointerEvents',
        'sideOffset',
        'state',
        'offsetX',
        'restoreFocus',
      ],
      outputs: ['stateChanged', 'closed'],
    },
  ],
  host: {
    'data-slot': 'mention',
  },
})
export class HlmMention {
  constructor() {
    classes(() => 'block');
  }
}
