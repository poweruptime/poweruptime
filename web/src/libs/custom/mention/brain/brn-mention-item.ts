import {isPlatformBrowser} from '@angular/common';
import {
  Directive,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import type {Highlightable} from '@angular/cdk/a11y';
import type {BooleanInput} from '@angular/cdk/coercion';

import {stringifyAsLabel} from '@spartan-ng/brain/core';

import {provideBrnMentionItem} from './brn-mention-item.token';
import {injectBrnMentionBase} from './brn-mention.token';

@Directive({
  selector: '[brnMentionItem]',
  providers: [provideBrnMentionItem(BrnMentionItem)],
  host: {
    role: 'option',
    '[id]': 'id()',
    '[attr.data-highlighted]': '_highlighted() ? "" : null',
    '[attr.data-value]': 'value()',
    '[attr.aria-selected]': 'active()',
    '[attr.aria-disabled]': '_disabled()',
    '(click)': 'select()',
    '(mouseenter)': 'activate()',
  },
})
export class BrnMentionItem implements Highlightable {
  private static _id = 0;

  private readonly _platform = inject(PLATFORM_ID);

  private readonly _elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Access the mention component */
  private readonly _mention = injectBrnMentionBase();

  /** A unique id for the item */
  public readonly id = input<string>(`brn-mention-item-${++BrnMentionItem._id}`);

  /** The value this item represents. */
  public readonly value = input.required<string>();

  // eslint-disable-next-line @typescript-eslint/naming-convention
  public readonly _disabled = input<boolean, BooleanInput>(false, {
    alias: 'disabled',
    transform: booleanAttribute,
  });

  /** Expose disabled as a value - used by the Highlightable interface */
  public get disabled() {
    return this._disabled();
  }

  /** Whether the item is selected. */
  public readonly active = computed(() => this._mention.isSelected(this.value()));

  protected readonly _highlighted = signal(false);

  setActiveStyles(): void {
    this._highlighted.set(true);

    // ensure the item is in view
    if (isPlatformBrowser(this._platform)) {
      this._elementRef.nativeElement.scrollIntoView({block: 'nearest'});
    }
  }

  setInactiveStyles(): void {
    this._highlighted.set(false);
  }

  getLabel(): string {
    return this.value();
  }

  protected select(): void {
    if (this._disabled()) {
      return;
    }

    this._mention.keyManager.setActiveItem(this);
    this._mention.select(this.value());
  }

  protected activate(): void {
    if (this._disabled()) {
      return;
    }

    this._mention.keyManager.setActiveItem(this);
  }
}
