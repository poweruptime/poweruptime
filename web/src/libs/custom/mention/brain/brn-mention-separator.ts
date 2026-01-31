import {Directive, input} from '@angular/core';

@Directive({
  selector: '[brnMentionSeparator]',
  host: {
    role: 'separator',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.data-orientation]': 'orientation()',
  },
})
export class BrnMentionSeparator {
  public readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
}
