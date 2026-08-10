import {
  type ExistingProvider,
  InjectionToken,
  type ModelSignal,
  type Signal,
  type Type,
  type ValueProvider,
  type WritableSignal,
  inject,
} from '@angular/core';

import type {ActiveDescendantKeyManager} from '@angular/cdk/a11y';

import type {ControlState} from '@spartan-ng/brain/forms';

import type {BrnMentionInput} from './brn-mention-input';
import type {BrnMentionItem} from './brn-mention-item';
import type {BrnMentionList} from './brn-mention-list';

export interface BrnMentionBase {
  search: ModelSignal<string>;
  disabled: Signal<boolean>;
  disabledState: Signal<boolean>;
  keyManager: ActiveDescendantKeyManager<BrnMentionItem>;
  value: ModelSignal<string | undefined | null>;
  visibleItems: Signal<boolean>;
  isExpanded: Signal<boolean>;
  searchInputWrapperWidth: Signal<number | null>;
  controlState: Signal<ControlState | null> | undefined;
  listId: Signal<string | undefined>;
  caretStartPosition: WritableSignal<number>;
  currentCaretPosition: WritableSignal<number>;

  update: (value: string) => void;
  updateSearch: (value: string) => void;
  isSelected: (itemValue: string) => boolean;
  select: (itemValue: string) => void;
  open: () => void;
  close: () => void;
  resetValue: () => void;
  /** Select the active item with Enter key. */
  selectActiveItem: () => void;
  registerMentionInput: (input: BrnMentionInput) => void;
  registerMentionList: (list: BrnMentionList) => void;
  updateInputWidth: (width: number | null) => void;
}

export const BrnMentionBaseToken = new InjectionToken<BrnMentionBase>('BrnMentionBaseToken');

export function provideBrnMentionBase(mention: Type<BrnMentionBase>): ExistingProvider {
  return {provide: BrnMentionBaseToken, useExisting: mention};
}

export function injectBrnMentionBase(): BrnMentionBase {
  return inject(BrnMentionBaseToken) as BrnMentionBase;
}

// config
export type MentionItemEqualToValue = (
  itemValue: string,
  selectedValue: string | undefined | null,
) => boolean;
export type MentionItemToString = (itemValue: string) => string;

export interface BrnMentionConfig {
  isItemEqualToValue: MentionItemEqualToValue;
  itemToString?: MentionItemToString;
  autoHighlight: boolean;
}

function getDefaultConfig(): BrnMentionConfig {
  return {
    isItemEqualToValue: (itemValue: string, selectedValue: string | undefined | null) =>
      Object.is(itemValue, selectedValue),
    itemToString: undefined,
    autoHighlight: false,
  };
}

const BrnMentionConfigToken = new InjectionToken<BrnMentionConfig>('BrnMentionConfig');

export function provideBrnMentionConfig(config: Partial<BrnMentionConfig>): ValueProvider {
  return {provide: BrnMentionConfigToken, useValue: {...getDefaultConfig(), ...config}};
}

export function injectBrnMentionConfig(): BrnMentionConfig {
  const injectedConfig = inject(BrnMentionConfigToken, {optional: true});
  return injectedConfig ? (injectedConfig as BrnMentionConfig) : getDefaultConfig();
}
