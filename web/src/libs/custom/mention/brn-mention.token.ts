// brn-mention.token.ts
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

import {ActiveDescendantKeyManager} from '@angular/cdk/a11y';

import {BrnAutocompleteItem} from '@spartan-ng/brain/autocomplete';

export interface BrnMentionBase<T> {
  trigger: InputSignal<string>;
  itemToString: InputSignal<MentionItemToString<T> | undefined>;
  search: ModelSignal<string>;
  disabled: Signal<boolean>;
  disabledState: Signal<boolean>;
  keyManager: ActiveDescendantKeyManager<BrnAutocompleteItem<T>>;
  value: ModelSignal<string | null>;
  visibleItems: Signal<boolean>;
  isExpanded: Signal<boolean>;
  searchInputWrapperWidth: Signal<number | null>;

  updateSearch: (value: string, cursorPosition: number) => void;
  isSelected: (itemValue: T) => boolean;
  select: (itemValue: T) => void;
  open: () => void;
  close: () => void;
  selectActiveItem: () => void;
  insertMention: (itemValue: T) => void;
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

export type MentionItemToString<T> = (itemValue: T) => string;

export interface BrnMentionConfig<T> {
  trigger: string;
  itemToString?: MentionItemToString<T>;
}

function getDefaultMentionConfig<T>(): BrnMentionConfig<T> {
  return {
    trigger: '@',
    itemToString: undefined,
  };
}

const BrnMentionConfigToken = new InjectionToken<BrnMentionConfig<unknown>>('BrnMentionConfig');

export function provideBrnMentionConfig<T>(config: Partial<BrnMentionConfig<T>>): ValueProvider {
  return {provide: BrnMentionConfigToken, useValue: {...getDefaultMentionConfig(), ...config}};
}

export function injectBrnMentionConfig<T>(): BrnMentionConfig<T> {
  const injectedConfig = inject(BrnMentionConfigToken, {optional: true});
  return injectedConfig ? (injectedConfig as BrnMentionConfig<T>) : getDefaultMentionConfig();
}
