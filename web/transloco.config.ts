import {TranslocoGlobalConfig} from '@jsverse/transloco-utils';

const config: TranslocoGlobalConfig = {
  langs: ['en'],
  rootTranslationsPath: 'src/assets/i18n/',
  keysManager: {
    unflat: true,
  },
};

export default config;
