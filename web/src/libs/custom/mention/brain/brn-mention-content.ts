import {Directive} from '@angular/core';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: '[brnMentionContent]',
  host: {
    '[attr.data-empty]': '!_visibleItems() ? "" : null',
    '[style.--brn-mention-width.px]': '_mentionWidth()',
  },
})
export class BrnMentionContent {
  private readonly _mention = injectBrnMentionBase();

  /** Determine if the autocomplete has any visible items */
  protected readonly _visibleItems = this._mention.visibleItems;

  protected readonly _mentionWidth = this._mention.searchInputWrapperWidth;
}
