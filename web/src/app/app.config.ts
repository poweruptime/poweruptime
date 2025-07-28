import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  isDevMode,
  provideZonelessChangeDetection,
} from '@angular/core';
import {provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter, withComponentInputBinding, withRouterConfig} from '@angular/router';

import {MAT_DATE_LOCALE, MatDateFormats} from '@angular/material/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';

import {provideUiTheme} from '@angularui/theme';
import {provideNgxMetaCore} from '@davidlj95/ngx-meta/core';
import {provideNgxMetaOpenGraph} from '@davidlj95/ngx-meta/open-graph';
import {provideNgxMetaStandard} from '@davidlj95/ngx-meta/standard';
import {provideTransloco} from '@jsverse/transloco';
import {cookiesStorage, provideTranslocoPersistLang} from '@jsverse/transloco-persist-lang';
import {de as dateFnsLocale} from 'date-fns/locale/de';
import {biCacheInterceptor, provideBi, withCDN} from 'dfx-bootstrap-icons';
import {provideDfxHelper, withMobileBreakpoint, withWindow} from 'dfx-helper';
import {
  BoldTextTranspiler,
  ItalicTextTranspiler,
  LinkTranspiler,
  provideLinkRenderer,
  provideTranslationMarkupTranspiler,
} from 'ngx-transloco-markup';

import {authInterceptor, backendOfflineInterceptor, mfaInterceptor} from '@app/interceptors';
import {TranslocoHttpLoader} from '@app/services';
import {
  CustomExternalLinkObjectLinkRenderer,
  CustomLinkRenderer,
} from '@app/services/custom-link-renderer.service';

import {ROUTES} from './pages/pages.routes';
import {provideTransferableLocalStorageImpl} from './util/transferable-localstorage';

const MY_DATE_FNS_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'yyyy-MM-dd',
  },
  display: {
    dateInput: 'dd.M.yyyy',
    monthYearLabel: 'yyyy',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'yyyy',
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(
      ROUTES,
      withComponentInputBinding(),
      withRouterConfig({paramsInheritanceStrategy: 'always'}),
    ),
    provideTransferableLocalStorageImpl(),
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        biCacheInterceptor,
        backendOfflineInterceptor,
        authInterceptor,
        mfaInterceptor,
      ]),
    ),
    provideAnimationsAsync(),
    provideUiTheme({
      strategy: 'class',
      storageKey: 'pu_theme',
    }),
    provideTransloco({
      config: {
        availableLangs: [
          {id: 'en', label: 'English'},
          {id: 'de', label: 'Deutsch'},
        ],
        defaultLang: 'en',
        prodMode: !isDevMode(),
        reRenderOnLangChange: true,
      },
      loader: TranslocoHttpLoader,
    }),
    provideTranslocoPersistLang({
      storageKey: 'pu_language',
      storage: {
        useValue: cookiesStorage(),
      },
    }),
    provideTranslationMarkupTranspiler(BoldTextTranspiler),
    provideTranslationMarkupTranspiler(ItalicTextTranspiler),
    provideTranslationMarkupTranspiler(LinkTranspiler),
    provideLinkRenderer(CustomLinkRenderer),
    provideLinkRenderer(CustomExternalLinkObjectLinkRenderer),
    provideBi(withCDN('/assets/icons')),
    provideDfxHelper(withWindow(), withMobileBreakpoint(640)),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: {
        appearance: 'outline',
      },
    },
    {provide: LOCALE_ID, useValue: 'en-US'},
    {provide: MAT_DATE_LOCALE, useValue: dateFnsLocale},
    provideDateFnsAdapter(MY_DATE_FNS_FORMATS),
    provideNgxMetaCore(),
    provideNgxMetaStandard(),
    provideNgxMetaOpenGraph(),
  ],
};
