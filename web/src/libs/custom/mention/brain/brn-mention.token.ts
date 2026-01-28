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

import type {BrnMentionItem} from './brn-mention-item';

export interface BrnMentionBase {
  search: ModelSignal<string>;
  disabled: Signal<boolean>;
  disabledState: Signal<boolean>;
  keyManager: ActiveDescendantKeyManager<BrnMentionItem>;
  value: ModelSignal<string | null>;
  visibleItems: Signal<boolean>;
  isExpanded: Signal<boolean>;
  searchInputWrapperWidth: Signal<number | null>;
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
}

export const BrnMentionBaseToken = new InjectionToken<BrnMentionBase>('BrnMentionBaseToken');

export function provideBrnMentionBase(mention: Type<BrnMentionBase>): ExistingProvider {
  return {provide: BrnMentionBaseToken, useExisting: mention};
}

export function injectBrnMentionBase(): BrnMentionBase {
  return inject(BrnMentionBaseToken);
}

export interface BrnMentionConfig {}

function getDefaultConfig(): BrnMentionConfig {
  return {};
}

const BrnMentionConfigToken = new InjectionToken<BrnMentionConfig>('BrnMentionConfig');

export function provideBrnMentionConfig<T>(config: Partial<BrnMentionConfig>): ValueProvider {
  return {provide: BrnMentionConfigToken, useValue: {...getDefaultConfig(), ...config}};
}

export function injectBrnMentionConfig<T>(): BrnMentionConfig {
  const injectedConfig = inject(BrnMentionConfigToken, {optional: true});
  return injectedConfig ? (injectedConfig as BrnMentionConfig) : getDefaultConfig();
}
