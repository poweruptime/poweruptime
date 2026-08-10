import {
  Directive,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

import {ActiveDescendantKeyManager} from '@angular/cdk/a11y';
import type {BooleanInput} from '@angular/cdk/coercion';

import {BrnFieldControl, provideBrnLabelable} from '@spartan-ng/brain/field';
import {ChangeFn, TouchFn} from '@spartan-ng/brain/forms';
import {BrnPopover} from '@spartan-ng/brain/popover';

import {BrnMentionInput} from './brn-mention-input';
import {BrnMentionItem} from './brn-mention-item';
import {BrnMentionItemToken} from './brn-mention-item.token';
import type {BrnMentionList} from './brn-mention-list';
import {
  BrnMentionBase,
  MentionItemEqualToValue,
  injectBrnMentionConfig,
  provideBrnMentionBase,
} from './brn-mention.token';

export const BRN_AUTOCOMPLETE_CONTROL_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BrnMention),
  multi: true,
};

@Directive({
  selector: '[brnMention]',
  providers: [
    BRN_AUTOCOMPLETE_CONTROL_VALUE_ACCESSOR,
    provideBrnMentionBase(BrnMention),
    provideBrnLabelable(BrnMention),
  ],
  hostDirectives: [BrnFieldControl],
  host: {
    '(focusout)': '_onFocusOut($event)',
  },
})
export class BrnMention implements BrnMentionBase, ControlValueAccessor {
  private readonly _injector = inject(Injector);
  private readonly _fieldControl = inject(BrnFieldControl, {optional: true});
  private readonly _config = injectBrnMentionConfig();

  /** Access the popover if present */
  private readonly _brnPopover = inject(BrnPopover, {optional: true});

  /** Whether the mention is disabled */
  public readonly disabled = input<boolean, BooleanInput>(false, {transform: booleanAttribute});

  protected readonly _disabled = linkedSignal(this.disabled);

  /** @internal The disabled state as a readonly signal */
  public readonly disabledState = this._disabled.asReadonly();

  /** A function to compare an item with the selected value. */
  public readonly isItemEqualToValue = input<MentionItemEqualToValue>(
    this._config.isItemEqualToValue,
  );

  /** Whether to auto-highlight the first matching item. */
  public readonly autoHighlight = input<boolean, BooleanInput>(this._config.autoHighlight, {
    transform: booleanAttribute,
  });

  /** The selected value of the mention. */
  public readonly value = model<string | undefined | null>(null);

  /** The current search query. */
  public readonly search = model<string>('');

  private readonly _inputWidth = signal<number | null>(null);

  /** @internal The width of the search input wrapper */
  public readonly searchInputWrapperWidth = this._inputWidth.asReadonly();

  /** @internal Access all the items within the mention */
  public readonly items = contentChildren<BrnMentionItem>(BrnMentionItemToken, {
    descendants: true,
  });

  /** Determine if the mention has any visible items */
  public readonly visibleItems = computed(() => this.items().length > 0);

  /** @internal The key manager for managing active descendant */
  public readonly keyManager = new ActiveDescendantKeyManager(this.items, this._injector);

  /** @internal Whether the mention is expanded */
  public readonly isExpanded = computed(() => this._brnPopover?.stateComputed() === 'open');

  private readonly _mentionInput = signal<BrnMentionInput | undefined>(undefined);

  private readonly _mentionList = signal<BrnMentionList | undefined>(undefined);

  /** @internal The id of the mention list, registered by BrnMentionList. Used by the input for aria-controls. */
  public readonly listId = computed(() => this._mentionList()?.id());

  public readonly caretStartPosition = signal(-1);
  public readonly currentCaretPosition = signal(-1);

  protected _onChange?: ChangeFn<string | undefined | null>;
  protected _onTouched?: TouchFn;

  public readonly labelableId = computed(() => this._mentionInput()?.id());

  public readonly controlState = this._fieldControl?.controlState;

  constructor() {
    this.keyManager
      .withVerticalOrientation()
      .withHomeAndEnd()
      .withWrap()
      .skipPredicate((item) => item.disabled);

    this._brnPopover?.closed.subscribe(() => {
      this.keyManager.setActiveItem(-1);
    });

    afterNextRender(() => {
      effect(
        () => {
          if (!this.autoHighlight() || !this.isExpanded() || !this.search()) return;

          const hasVisibleItems = this.visibleItems();

          untracked(() => {
            if (hasVisibleItems) {
              this.keyManager.setFirstItemActive();
            } else {
              this.keyManager.setActiveItem(-1);
            }
          });
        },
        {injector: this._injector},
      );
    });
  }

  public registerMentionInput(input: BrnMentionInput): void {
    return this._mentionInput.set(input);
  }

  /** @internal Register the mention list. Called by BrnMentionList in its constructor. */
  public registerMentionList(list: BrnMentionList): void {
    this._mentionList.set(list);
  }

  public updateInputWidth(width: number | null): void {
    this._inputWidth.set(width);
  }

  update(value: string) {
    this.value.set(value);
    this._onChange?.(value);
  }

  updateSearch(value: string) {
    this.search.set(value);
  }

  isSelected(itemValue: string): boolean {
    return this.isItemEqualToValue()(itemValue, this.value());
  }

  select(itemValue: string) {
    const currentValue = this.value() ?? '';
    const before = currentValue.slice(0, this.caretStartPosition());
    const after = currentValue.slice(this.currentCaretPosition());

    // For example, we might insert "@someValue "
    const newValue = before + '!' + itemValue + ' ' + after;
    this.value.set(newValue);
    this._onChange?.(newValue);
    this.search.set('');
    this.close();
  }

  /** Select the active item with Enter key. */
  selectActiveItem() {
    if (!this.isExpanded()) return;

    const value = this.keyManager.activeItem?.value();

    if (value) {
      this.select(value);
    } else {
      this.close();
    }
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
  writeValue(value: string | undefined | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: ChangeFn<string | undefined | null>): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: TouchFn): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    this._disabled.set(isDisabled);
  }

  protected _onFocusOut(event: FocusEvent): void {
    const currentTarget = event.currentTarget as HTMLElement;
    const focusedEl = event.relatedTarget as HTMLElement | null;

    if (!currentTarget.contains(focusedEl)) {
      this._onTouched?.();
    }
  }
}
