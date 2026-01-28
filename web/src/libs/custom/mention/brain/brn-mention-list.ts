import {Directive, input} from '@angular/core';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: '[brnMentionList]',
  host: {
    role: 'listbox',
    tabIndex: '-1',
    'aria-orientation': 'vertical',
    '[id]': 'id()',
    '[attr.data-empty]': '!_visibleItems() ? "" : null',
  },
})
export class BrnMentionList {
  private static _id = 0;

  private readonly _mention = injectBrnMentionBase();

  /** Determine if the mention has any visible items */
  protected readonly _visibleItems = this._mention.visibleItems;

  /** The id of the mention list */
  public readonly id = input<string>(`brn-mention-list-${++BrnMentionList._id}`);
}
