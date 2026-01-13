import {HlmMentions} from './hlm-mentions';
import {HlmMentionsAutocomplete} from './hlm-mentions-autocomplete';

export * from './hlm-mentions';
export * from './hlm-mentions-autocomplete';

export const HlmPaginatorImports = [HlmMentions, HlmMentionsAutocomplete] as const;
