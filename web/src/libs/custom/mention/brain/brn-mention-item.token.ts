import {type ExistingProvider, InjectionToken, type Type} from '@angular/core';

import type {BrnMentionItem} from './brn-mention-item';

export const BrnMentionItemToken = new InjectionToken<BrnMentionItem<unknown>>(
  'BrnMentionItemToken',
);

export function provideBrnMentionItem<T>(mention: Type<BrnMentionItem<T>>): ExistingProvider {
  return {provide: BrnMentionItemToken, useExisting: mention};
}
