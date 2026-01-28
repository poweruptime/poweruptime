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
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import {ActiveDescendantKeyManager} from '@angular/cdk/a11y';
import type {BooleanInput} from '@angular/cdk/coercion';

import {stringifyAsLabel} from '@spartan-ng/brain/core';
import {ChangeFn, TouchFn} from '@spartan-ng/brain/forms';
import {BrnPopover} from '@spartan-ng/brain/popover';

import {BrnMentionInputWrapper} from './brn-mention-input-wrapper';
import {BrnMentionItem} from './brn-mention-item';
import {BrnMentionItemToken} from './brn-mention-item.token';
import {
  BrnMentionBase,
  MentionItemEqualToValue,
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
  providers: [provideBrnMentionBase(BrnMention), BRN_MENTION_VALUE_ACCESSOR],
})
export class BrnMention<T> implements BrnMentionBase<T>, ControlValueAccessor {
  private readonly _injector = inject(Injector);

  private readonly _config = injectBrnMentionConfig<T>();

  /** Access the popover if present */
  private readonly _brnPopover = inject(BrnPopover, {optional: true});

  /** Whether the mention is disabled */
  public readonly disabled = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  protected readonly _disabled = linkedSignal(this.disabled);

  /** @internal The disabled state as a readonly signal */
  public readonly disabledState = this._disabled.asReadonly();

  /** A function to compare an item with the selected value. */
  public readonly isItemEqualToValue = input<MentionItemEqualToValue<T>>(
    this._config.isItemEqualToValue,
  );

  /** A function to convert an item to a string for display. */
  public readonly itemToString = input<MentionItemToString<T> | undefined>(
    this._config.itemToString,
  );

  /** The selected value of the mention. */
  public readonly value = model<T | null>(null);

  /** The current search query. */
  public readonly search = model<string>('');

  private readonly _searchInputWrapper = contentChild(BrnMentionInputWrapper, {
    read: ElementRef,
  });

  /** @internal The width of the search input wrapper */
  public readonly searchInputWrapperWidth = computed<number | null>(() => {
    const inputElement = this._searchInputWrapper()?.nativeElement;
    return inputElement ? (inputElement.offsetWidth as number) : null;
  });

  /** @internal Access all the items within the mention */
  public readonly items = contentChildren<BrnMentionItem<T>>(BrnMentionItemToken, {
    descendants: true,
  });

  /** Determine if the mention has any visible items */
  public readonly visibleItems = computed(() => this.items().length > 0);

  /** @internal The key manager for managing active descendant */
  public readonly keyManager = new ActiveDescendantKeyManager(this.items, this._injector);

  /** @internal Whether the mention is expanded */
  public readonly isExpanded = computed(() => this._brnPopover?.stateComputed() === 'open');

  protected _onChange?: ChangeFn<T | null>;
  protected _onTouched?: TouchFn;

  constructor() {
    this.keyManager
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withWrap()
      .skipPredicate((item) => item.disabled);

    this._brnPopover?.closed.subscribe(() => {
      this.keyManager.setActiveItem(-1);
    });
  }

  updateSearch(value: string) {
    this.search.set(value);
    this.open();

    if (value === '') {
      this.resetValue();
    }
  }

  isSelected(itemValue: T): boolean {
    return this.isItemEqualToValue()(itemValue, this.value());
  }

  select(itemValue: T) {
    this.value.set(itemValue);
    this._onChange?.(itemValue);
    this.search.set(stringifyAsLabel(itemValue, this.itemToString()));
    this.close();
  }

  /** Select the active item with Enter key. */
  selectActiveItem() {
    if (!this.isExpanded()) return;

    const value = this.keyManager.activeItem?.value();

    if (value === undefined) return;

    this.select(value);
  }

  resetValue() {
    this.value.set(null);
    this.search.set('');
    this._onChange?.(null);
  }

  open() {
    if (this._disabled() || this.isExpanded()) return;

    this._brnPopover?.open();
  }

  close() {
    if (this._disabled() || !this.isExpanded()) return;

    this._brnPopover?.close();
  }

  toggle() {
    if (this._disabled()) return;

    this.isExpanded() ? this.close() : this.open();
  }

  /** CONTROL VALUE ACCESSOR */
  writeValue(value: T | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: ChangeFn<T | null>): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: TouchFn): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this._disabled.set(isDisabled);
  }
}
