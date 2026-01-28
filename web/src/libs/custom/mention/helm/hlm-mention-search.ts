import {Directive} from '@angular/core';

import {provideBrnDialogDefaultOptions} from '@spartan-ng/brain/dialog';
import {BrnPopover, provideBrnPopoverConfig} from '@spartan-ng/brain/popover';
import {classes} from '@spartan-ng/helm/utils';

import {BrnMentionSearch} from '../brain';

@Directive({
  selector: '[hlmMentionSearch],hlm-mention-search',
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
      directive: BrnMentionSearch,
      inputs: ['disabled', 'value', 'search', 'itemToString'],
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
export class HlmMentionSearch {
  constructor() {
    classes(() => 'block');
  }
}
