import {Directive, ElementRef, effect, inject, input, signal} from '@angular/core';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: 'textarea[brnMentionInput]',
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
  private readonly _mention = injectBrnMentionBase();

  /** The id of the mention input */
  public readonly id = input<string>(`brn-mention-input-${++BrnMentionInput._id}`);

  public readonly disabled = this._mention.disabledState;

  /** Whether the mention panel is expanded */
  protected readonly _isExpanded = this._mention.isExpanded;

  constructor() {
    effect(() => {
      this._el.nativeElement.value = this._mention.value();
    });
  }

  private _getCurrentCaretPosition(): number {
    return getCurrentCaretPosition(this._el.nativeElement);
  }

  private _previousValue?: string;

  protected onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const currentCaretPosition = this._getCurrentCaretPosition();

    this._mention.currentCaretPosition.set(currentCaretPosition);

    if (this._previousValue !== value) {
      this._previousValue = value;
      this._mention.update(value);

      const caretStartPosition = this._mention.caretStartPosition();

      if (this._isExpanded() && caretStartPosition >= 0) {
        if (currentCaretPosition > caretStartPosition) {
          // The user is typing after the trigger char, so you can do filtering logic here.
          const mentionText = value.substring(caretStartPosition + 1, currentCaretPosition);
          this._mention.updateSearch(mentionText);
        } else {
          this._mention.updateSearch('');
          this._mention.close();
        }
      }
    }
  }

  protected onKeyDown(event: KeyboardEvent) {
    if (!this._isExpanded()) {
      if (event.key === '!') {
        this._mention.open();
        this._mention.caretStartPosition.set(this._getCurrentCaretPosition());

        return;
      }
    } else {
      if (event.key === 'Enter') {
        // prevent form submission if inside a form
        event.preventDefault();

        this._mention.selectActiveItem();
      }

      if (event.key === ' ') {
        this._mention.close();
      }

      this._mention.keyManager.onKeydown(event);
    }
  }
}
export function getCurrentCaretPosition(el: HTMLInputElement) {
  const val = el.value;
  return val.slice(0, el.selectionStart ?? 0).length;
}
