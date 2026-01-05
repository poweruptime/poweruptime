import {
  HlmCaption,
  HlmTBody,
  HlmTFoot,
  HlmTHead,
  HlmTable,
  HlmTableContainer,
  HlmTd,
  HlmTh,
  HlmTr,
} from './lib/hlm-table';

export * from './lib/hlm-table';

export const HlmTableImports = [
  HlmCaption,
  HlmTableContainer,
  HlmTable,
  HlmTBody,
  HlmTd,
  HlmTFoot,
  HlmTh,
  HlmTHead,
  HlmTr,
] as const;
