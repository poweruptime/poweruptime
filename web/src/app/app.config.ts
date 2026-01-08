import {HttpClient, provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {ApplicationConfig, LOCALE_ID, inject, isDevMode} from '@angular/core';
import {provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {provideRouter, withComponentInputBinding, withRouterConfig} from '@angular/router';

import {MAT_DATE_LOCALE, MatDateFormats} from '@angular/material/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';

import {provideNgxMetaCore} from '@davidlj95/ngx-meta/core';
import {provideNgxMetaOpenGraph} from '@davidlj95/ngx-meta/open-graph';
import {provideNgxMetaStandard} from '@davidlj95/ngx-meta/standard';
import {provideTransloco} from '@jsverse/transloco';
import {cookiesStorage, provideTranslocoPersistLang} from '@jsverse/transloco-persist-lang';
import {provideNgIconLoader, withCaching} from '@ng-icons/core';
import {provideHlmDatePickerConfig} from '@spartan-ng/helm/date-picker';
import {provideHlmSidebarConfig} from '@spartan-ng/helm/sidebar';
import {provideHlmTableConfig} from '@spartan-ng/helm/table';
import {format} from 'date-fns';
import {de as dateFnsLocale} from 'date-fns/locale/de';
import {provideDfxHelper, withMobileBreakpoint, withWindow} from 'dfx-helper';
import {provideTheme, withThemeStorage} from 'dfx-theme';
import {
  BoldTextTranspiler,
  ItalicTextTranspiler,
  LinkTranspiler,
  provideLinkRenderer,
  provideTranslationMarkupTranspiler,
} from 'dfx-transloco-markup';

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
    provideRouter(
      ROUTES,
      withComponentInputBinding(),
      withRouterConfig({paramsInheritanceStrategy: 'always'}),
    ),
    provideTransferableLocalStorageImpl(),
    provideClientHydration(withEventReplay(), withIncrementalHydration()),
    provideHttpClient(
      withFetch(),
      withInterceptors([backendOfflineInterceptor, authInterceptor, mfaInterceptor]),
    ),
    provideTheme(withThemeStorage({key: 'pu_theme'})),
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
    provideNgIconLoader((name) => {
      const http = inject(HttpClient);
      return http.get(`/assets/icons/${name}.svg`, {responseType: 'text'});
    }, withCaching()),
    provideDfxHelper(withWindow(), withMobileBreakpoint(640)),
    provideHlmDatePickerConfig({
      formatDate: (date: Date) => format(date, 'dd.M.yyyy', {locale: dateFnsLocale}),
    }),
    provideHlmTableConfig({
      th: 'text-foreground h-10 px-2 text-start align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pe-0 font-bold',
    }),
    provideHlmSidebarConfig({
      mobileBreakpoint: '1920px',
    }),
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
