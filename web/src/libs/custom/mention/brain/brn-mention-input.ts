import {Directive, ElementRef, effect, inject, input} from '@angular/core';

import {stringifyAsLabel} from '@spartan-ng/brain/core';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: 'input[brnMentionInput]',
  exportAs: 'brnMentionInput',
  host: {
    '[id]': 'id()',
    type: 'text',
    role: 'combobox',
    autocomplete: 'off',
    autocorrect: 'off',
    autocapitalize: 'none',
    spellcheck: 'false',
    'aria-autocomplete': 'list',
    'aria-haspopup': 'listbox',
    '[attr.aria-expanded]': '_isExpanded()',
    '[attr.disabled]': 'disabled() ? "" : null',
    '(keydown)': 'onKeyDown($event)',
    '(input)': 'onInput($event)',
  },
})
export class BrnMentionInput<T> {
  private static _id = 0;
  private readonly _el = inject(ElementRef);
  private readonly _mention = injectBrnMentionBase<T>();

  /** The id of the mention input */
  public readonly id = input<string>(`brn-mention-input-${++BrnMentionInput._id}`);

  public readonly disabled = this._mention.disabledState;

  /** Whether the mention panel is expanded */
  protected readonly _isExpanded = this._mention.isExpanded;

  constructor() {
    effect(() => {
      const value = this._mention.value();
      const search = this._mention.search();

      const valueLabel = stringifyAsLabel(value, this._mention.itemToString());

      if (valueLabel === search) {
        this._el.nativeElement.value = valueLabel;
      } else if (search === '') {
        this._el.nativeElement.value = '';
      }
    });
  }

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this._mention.updateSearch(value);
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      // prevent form submission if inside a form
      event.preventDefault();

      this._mention.selectActiveItem();
    }

    if (!this._isExpanded()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        this._mention.open();
      }

      if (event.key === 'Escape') {
        this._mention.resetValue();
      }
    }

    this._mention.keyManager.onKeydown(event);
  }
}
