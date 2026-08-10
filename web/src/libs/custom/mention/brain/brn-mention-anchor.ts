import {Directive, ElementRef, effect, inject} from '@angular/core';

import {injectElementSize} from '@spartan-ng/brain/core';
import {BrnOverlay} from '@spartan-ng/brain/overlay';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({selector: '[brnMentionAnchor]'})
export class BrnMentionAnchor {
  private readonly _host = inject(ElementRef, {host: true});
  private readonly _brnOverlay = inject(BrnOverlay, {optional: true});

  private readonly _mention = injectBrnMentionBase();
  private readonly _elementSize = injectElementSize();

  constructor() {
    this._brnOverlay?.setOrigin(this._host.nativeElement);

    effect(() => {
      const size = this._elementSize();
      if (!size) return;

      this._mention.updateInputWidth(size.width);
      this._brnOverlay?.updatePosition();
    });
  }
}
