// libs/shared/ui/mentions/src/lib/hlm-mentions.directive.ts
import {
  type AfterViewInit,
  Directive,
  ElementRef,
  type OnDestroy,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';

import {ESCAPE, SPACE, hasModifierKey} from '@angular/cdk/keycodes';

import {getCaretPosition, setCaretPosition} from './utils';

@Directive({
  selector: 'input[hlmMentions], textarea[hlmMentions], [hlmMentions]',
  host: {
    '(keydown)': '_handleKeydown($event)',
    '(input)': '_handleInput($event)',
  },
})
export class HlmMentions implements AfterViewInit, OnDestroy {
  private readonly _element =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);

  /** The trigger character for mentions (e.g., '@', '#') */
  public readonly mentionTriggerChar = input<string>('@');

  /** The current mention filter text */
  public readonly mentionFilter = model<string>('');

  /** Whether the mention mode is currently active */
  public readonly mentionActive = model<boolean>(false);

  /** Emitted when a mention is selected */
  public readonly mentionSelected = output<string>();

  /** Position where the mention trigger was typed */
  private _mentionStartPos = -1;

  constructor() {
    // Reset mention state when filter is cleared externally
    effect(() => {
      const filter = this.mentionFilter();
      if (filter === '' && this.mentionActive()) {
        this._resetMentionState();
      }
    });
  }

  ngAfterViewInit(): void {
    // Initialization if needed
  }

  ngOnDestroy(): void {
    this._resetMentionState();
  }

  _handleKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;

    // Check if user typed the mention trigger character
    if (!this.mentionActive() && event.key === this.mentionTriggerChar()) {
      this._startMentionMode();
      return;
    }

    // Handle keys when in mention mode
    if (this.mentionActive()) {
      // ESC exits mention mode
      if (keyCode === ESCAPE && !hasModifierKey(event)) {
        event.preventDefault();
        this._resetMentionState();
        return;
      }

      // SPACE exits mention mode
      if (keyCode === SPACE) {
        this._resetMentionState();
      }
    }
  }

  _handleInput(event: Event): void {
    if (!this.mentionActive()) {
      return;
    }

    const inputEl = event.target as HTMLInputElement | HTMLTextAreaElement;
    const caretPos = getCaretPosition(inputEl);

    // Check if user backspaced before the trigger character
    if (caretPos <= this._mentionStartPos) {
      this._resetMentionState();
      return;
    }

    // Extract the mention text (text between trigger and caret)
    const mentionText = inputEl.value.substring(this._mentionStartPos + 1, caretPos);
    this.mentionFilter.set(mentionText);
  }

  /**
   * Insert a mention at the current trigger position
   */
  public insertMention(value: string): void {
    if (!this.mentionActive() || this._mentionStartPos < 0) {
      return;
    }

    const inputEl = this._element.nativeElement;
    const currentValue = inputEl.value;
    const caretPos = getCaretPosition(inputEl);

    // Build new value: before trigger + trigger + value + space + after caret
    const before = currentValue.slice(0, this._mentionStartPos);
    const after = currentValue.slice(caretPos);
    const newValue = `${before}${this.mentionTriggerChar()}${value} ${after}`;

    // Update input value
    inputEl.value = newValue;
    inputEl.dispatchEvent(new Event('input', {bubbles: true}));

    // Move caret after the inserted mention
    const newCaretPos = before.length + 1 + value.length + 1;
    setCaretPosition(inputEl, newCaretPos);

    // Emit selection event
    this.mentionSelected.emit(value);

    // Reset mention state
    this._resetMentionState();
  }

  private _startMentionMode(): void {
    this.mentionActive.set(true);
    this._mentionStartPos = getCaretPosition(this._element.nativeElement);
    this.mentionFilter.set('');
  }

  private _resetMentionState(): void {
    this.mentionActive.set(false);
    this._mentionStartPos = -1;
    this.mentionFilter.set('');
  }
}
