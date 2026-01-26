import {
  Directive,
  ElementRef,
  Injector,
  booleanAttribute,
  computed,
  contentChild,
  contentChildren,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import {ActiveDescendantKeyManager} from '@angular/cdk/a11y';
import type {BooleanInput} from '@angular/cdk/coercion';

import {
  BrnAutocompleteBaseToken,
  BrnAutocompleteInputWrapper,
  BrnAutocompleteItem,
  BrnAutocompleteItemToken,
} from '@spartan-ng/brain/autocomplete';
import {stringifyAsLabel} from '@spartan-ng/brain/core';
import {ChangeFn, TouchFn} from '@spartan-ng/brain/forms';
import {BrnPopover} from '@spartan-ng/brain/popover';

import {
  BrnMentionBase,
  MentionItemToString,
  injectBrnMentionConfig,
  provideBrnMentionBase,
} from './brn-mention.token';

export const BRN_MENTION_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BrnMention),
  multi: true,
};

@Directive({
  selector: '[brnMention]',
  providers: [
    provideBrnMentionBase(BrnMention),
    {provide: BrnAutocompleteBaseToken, useExisting: forwardRef(() => BrnMention)},
    BRN_MENTION_VALUE_ACCESSOR,
  ],
})
export class BrnMention<T> implements BrnMentionBase<T>, ControlValueAccessor {
  private readonly _injector = inject(Injector);
  private readonly _config = injectBrnMentionConfig<T>();
  private readonly _brnPopover = inject(BrnPopover, {optional: true});

  /** The character that triggers the mention dropdown */
  public readonly trigger = input<string>(this._config.trigger);

  /** Whether the mention input is disabled */
  public readonly disabled = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  protected readonly _disabled = linkedSignal(this.disabled);

  /** @internal The disabled state as a readonly signal */
  public readonly disabledState = this._disabled.asReadonly();

  /** A function to convert an item to a string for display */
  public readonly itemToString = input<MentionItemToString<T> | undefined>(
    this._config.itemToString,
  );

  /** The complete input value */
  public readonly value = model<string | null>(null);

  /** The current search query (text after trigger) */
  public readonly search = model<string>('');

  /** @internal The position where the mention trigger starts */
  private readonly _mentionStartPos = signal<number | null>(null);

  /** @internal The cursor position when mention was triggered */
  private readonly _cursorPosition = signal<number>(0);

  private readonly _searchInputWrapper = contentChild(BrnAutocompleteInputWrapper, {
    read: ElementRef,
  });

  /** @internal The width of the search input wrapper */
  public readonly searchInputWrapperWidth = computed<number | null>(() => {
    const inputElement = this._searchInputWrapper()?.nativeElement;
    return inputElement ? (inputElement.offsetWidth as number) : null;
  });

  /** @internal Access all the items within the mention */
  public readonly items = contentChildren<BrnAutocompleteItem<T>>(BrnAutocompleteItemToken, {
    descendants: true,
  });

  /** Determine if the mention has any visible items */
  public readonly visibleItems = computed(() => this.items().length > 0);

  /** @internal The key manager for managing active descendant */
  public readonly keyManager = new ActiveDescendantKeyManager(this.items, this._injector);

  /** @internal Whether the mention dropdown is expanded */
  public readonly isExpanded = computed(() => this._brnPopover?.stateComputed() === 'open');

  protected _onChange?: ChangeFn<string | null>;
  protected _onTouched?: TouchFn;

  constructor() {
    this.keyManager
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withWrap()
      .skipPredicate((item) => item.disabled);

    this._brnPopover?.closed.subscribe(() => {
      this.keyManager.setActiveItem(-1);
      this._mentionStartPos.set(null);
      this.search.set('');
    });
  }

  updateSearch(value: string, cursorPosition: number): void {
    this._cursorPosition.set(cursorPosition);

    const triggerChar = this.trigger();
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastTriggerIndex = textBeforeCursor.lastIndexOf(triggerChar);

    if (lastTriggerIndex !== -1) {
      const textAfterTrigger = textBeforeCursor.substring(lastTriggerIndex + 1);

      // Check if there's a space after trigger (which would end the mention)
      if (!textAfterTrigger.includes(' ')) {
        this._mentionStartPos.set(lastTriggerIndex);
        this.search.set(textAfterTrigger);
        this.open();
        return;
      }
    }

    // No valid mention trigger found
    this.close();
  }

  isSelected(itemValue: T): boolean {
    // For mentions, we don't highlight selected items in the same way
    return false;
  }

  select(itemValue: T): void {
    this.insertMention(itemValue);
  }

  /** Select the active item with Enter key */
  selectActiveItem(): void {
    if (!this.isExpanded()) return;

    const itemValue = this.keyManager.activeItem?.value();

    if (itemValue === undefined) return;

    this.select(itemValue);
  }

  insertMention(itemValue: T): void {
    const currentValue = this.value() || '';
    const mentionStart = this._mentionStartPos();

    if (mentionStart === null) return;

    const mentionText = stringifyAsLabel(itemValue, this.itemToString());
    const triggerChar = this.trigger();

    // Build the new value: text before trigger + trigger + mention + text after cursor
    const beforeTrigger = currentValue.substring(0, mentionStart);
    const afterCursor = currentValue.substring(this._cursorPosition());
    const newValue = `${beforeTrigger}${triggerChar}${mentionText} ${afterCursor}`;

    this.value.set(newValue);
    this._onChange?.(newValue);

    this.close();
    this.search.set('');
    this._mentionStartPos.set(null);
  }

  open(): void {
    if (this._disabled() || this.isExpanded()) return;
    this._brnPopover?.open();
  }

  close(): void {
    if (this._disabled() || !this.isExpanded()) return;
    this._brnPopover?.close();
  }

  toggle(): void {
    if (this._disabled()) return;
    this.isExpanded() ? this.close() : this.open();
  }

  /** CONTROL VALUE ACCESSOR */
  writeValue(value: string | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: ChangeFn<string | null>): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: TouchFn): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }
}
