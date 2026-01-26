import {Directive, ElementRef, inject, input} from '@angular/core';

import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: 'input[brnMentionInput],textarea[brnMentionInput]',
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
    '(click)': 'onClick()',
  },
})
export class BrnMentionInput<T> {
  private static _id = 0;
  private readonly _el = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private readonly _mention = injectBrnMentionBase<T>();

  /** The id of the mention input */
  public readonly id = input<string>(`brn-mention-input-${++BrnMentionInput._id}`);

  public readonly disabled = this._mention.disabledState;

  /** Whether the mention panel is expanded */
  protected readonly _isExpanded = this._mention.isExpanded;

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const value = target.value;
    const cursorPosition = target.selectionStart || 0;

    this._mention.value.set(value);
    this._mention.updateSearch(value, cursorPosition);
  }

  protected onClick(): void {
    const cursorPosition = this._el.nativeElement.selectionStart || 0;
    const value = this._el.nativeElement.value;
    this._mention.updateSearch(value, cursorPosition);
  }

  protected onKeyDown(_event: Event): void {
    const event = _event as KeyboardEvent;

    if (event.key === 'Enter' && this._isExpanded()) {
      event.preventDefault();
      this._mention.selectActiveItem();

      // Set cursor position after mention insertion
      setTimeout(() => {
        const newValue = this._mention.value() || '';
        const mentionEnd = newValue.length;
        this._el.nativeElement.setSelectionRange(mentionEnd, mentionEnd);
      });
      return;
    }

    if (event.key === 'Escape' && this._isExpanded()) {
      event.preventDefault();
      this._mention.close();
      return;
    }

    if (this._isExpanded()) {
      this._mention.keyManager.onKeydown(event);
    }
  }
}
