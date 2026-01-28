import {Directive, computed, contentChild, contentChildren} from '@angular/core';

import {BrnMentionItemToken} from './brn-mention-item.token';
import {BrnMentionLabel} from './brn-mention-label';

@Directive({
  selector: '[brnMentionGroup]',
  host: {
    role: 'group',
    '[attr.data-hidden]': '!_visible() ? "" : null',
    '[attr.aria-labelledby]': '_labelledBy()',
  },
})
export class BrnMentionGroup {
  /** Get the items in the group */
  private readonly _items = contentChildren(BrnMentionItemToken, {
    descendants: true,
  });

  /** Determine if there are any visible items in the group */
  protected readonly _visible = computed(() => this._items().length > 0);

  /** Get the label associated with the group */
  private readonly _label = contentChild(BrnMentionLabel);

  protected readonly _labelledBy = computed(() => {
    const label = this._label();
    return label ? label.id() : null;
  });
}
