import {
  Directive,
  Renderer2,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
} from '@angular/core';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: '[brnMentionClear]',
})
export class BrnMentionClear {
  private readonly _mention = injectBrnMentionBase();
  private readonly _renderer = inject(Renderer2);
  private readonly _templateRef = inject<TemplateRef<void>>(TemplateRef);
  private readonly _viewContainerRef = inject(ViewContainerRef);

  /** Determine if the combobox has a value */
  private readonly _hasValue = computed(() => this._mention.value() !== null);

  constructor() {
    effect(() => {
      this._viewContainerRef.clear();
      if (this._hasValue()) {
        const view = this._viewContainerRef.createEmbeddedView(this._templateRef);
        view.rootNodes.forEach((node) => {
          this._renderer.listen(node, 'click', (e) => {
            e.preventDefault();
            this.clear();
          });
        });
      }
    });
  }

  clear() {
    this._mention.resetValue();
  }
}
