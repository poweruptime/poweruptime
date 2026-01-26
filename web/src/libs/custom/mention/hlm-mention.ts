// hlm-mention.directive.ts
import {Directive} from '@angular/core';

import {provideBrnDialogDefaultOptions} from '@spartan-ng/brain/dialog';
import {BrnPopover, provideBrnPopoverConfig} from '@spartan-ng/brain/popover';
import {classes} from '@spartan-ng/helm/utils';

import {BrnMention} from './brn-mention';

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
      inputs: ['disabled', 'value', 'search', 'trigger', 'itemToString'],
      outputs: ['valueChange', 'searchChange'],
    },
    {
      directive: BrnPopover,
      inputs: ['align', 'sideOffset', 'state', 'closeOnOutsidePointerEvents'],
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
