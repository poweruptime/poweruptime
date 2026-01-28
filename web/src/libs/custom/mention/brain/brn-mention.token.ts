import {
  type ExistingProvider,
  InjectionToken,
  type InputSignal,
  type ModelSignal,
  type Signal,
  type Type,
  type ValueProvider,
  inject,
} from '@angular/core';

import type {ActiveDescendantKeyManager} from '@angular/cdk/a11y';

import type {BrnMentionItem} from './brn-mention-item';

export interface BrnMentionBase<T> {
  itemToString: InputSignal<MentionItemToString<T> | undefined>;
  search: ModelSignal<string>;
  disabled: Signal<boolean>;
  disabledState: Signal<boolean>;
  keyManager: ActiveDescendantKeyManager<BrnMentionItem<T>>;
  value: ModelSignal<T | null> | ModelSignal<string | null>;
  visibleItems: Signal<boolean>;
  isExpanded: Signal<boolean>;
  searchInputWrapperWidth: Signal<number | null>;

  updateSearch: (value: string) => void;
  isSelected: (itemValue: T) => boolean;
  select: (itemValue: T) => void;
  open: () => void;
  resetValue: () => void;
  /** Select the active item with Enter key. */
  selectActiveItem: () => void;
}

export const BrnMentionBaseToken = new InjectionToken<BrnMentionBase<unknown>>(
  'BrnMentionBaseToken',
);

export function provideBrnMentionBase<T>(mention: Type<BrnMentionBase<T>>): ExistingProvider {
  return {provide: BrnMentionBaseToken, useExisting: mention};
}

export function injectBrnMentionBase<T>(): BrnMentionBase<T> {
  return inject(BrnMentionBaseToken) as BrnMentionBase<T>;
}

// config
export type MentionItemEqualToValue<T> = (itemValue: T, selectedValue: T | null) => boolean;
export type MentionItemToString<T> = (itemValue: T) => string;

export interface BrnMentionConfig<T> {
  isItemEqualToValue: MentionItemEqualToValue<T>;
  itemToString?: MentionItemToString<T>;
}

function getDefaultConfig<T>(): BrnMentionConfig<T> {
  return {
    isItemEqualToValue: (itemValue: T, selectedValue: T | null) =>
      Object.is(itemValue, selectedValue),
    itemToString: undefined,
  };
}

const BrnMentionConfigToken = new InjectionToken<BrnMentionConfig<unknown>>('BrnMentionConfig');

export function provideBrnMentionConfig<T>(config: Partial<BrnMentionConfig<T>>): ValueProvider {
  return {provide: BrnMentionConfigToken, useValue: {...getDefaultConfig(), ...config}};
}

export function injectBrnMentionConfig<T>(): BrnMentionConfig<T> {
  const injectedConfig = inject(BrnMentionConfigToken, {optional: true});
  return injectedConfig ? (injectedConfig as BrnMentionConfig<T>) : getDefaultConfig();
}
