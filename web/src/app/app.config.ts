import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  importProvidersFrom,
  isDevMode,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import {provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {MAT_DATE_LOCALE, MatDateFormats} from '@angular/material/core';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {
  provideClientHydration,
  withEventReplay,
  withIncrementalHydration,
} from '@angular/platform-browser';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {provideRouter, withComponentInputBinding, withRouterConfig} from '@angular/router';

import {provideNgxMetaCore} from '@davidlj95/ngx-meta/core';
import {provideTransloco} from '@jsverse/transloco';
import {cookiesStorage, provideTranslocoPersistLang} from '@jsverse/transloco-persist-lang';
import {de as dateFnsLocale} from 'date-fns/locale/de';
import {biCacheInterceptor, provideBi, withCDN} from 'dfx-bootstrap-icons';
import {provideDfxHelper, withMobileBreakpoint, withWindow} from 'dfx-helper';
import {MarkedOptions} from 'marked';
import {NgxEditorModule} from 'ngx-editor';
import {MARKED_OPTIONS, MarkedRenderer, provideMarkdown} from 'ngx-markdown';
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

import {ROUTES} from './app.routes';

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

const markedOptionsFactory = (): MarkedOptions => {
  const renderer = new MarkedRenderer();

  renderer.link = ({href, text}): string => {
    return `<a target="_blank" href="${href}">${text}</a>`;
  };

  return {
    renderer: renderer,
    gfm: true,
    breaks: true,
    pedantic: false,
  };
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(
      ROUTES,
      withComponentInputBinding(),
      withRouterConfig({paramsInheritanceStrategy: 'always'}),
    ),
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
    provideMarkdown({markedOptions: {provide: MARKED_OPTIONS, useFactory: markedOptionsFactory}}),
    importProvidersFrom(
      NgxEditorModule.forRoot({
        locals: {
          // menu
          bold: 'Bold',
          italic: 'Italic',
          code: 'Code',
          blockquote: 'Blockquote',
          underline: 'Underline',
          strike: 'Strike',
          bullet_list: 'Bullet List',
          ordered_list: 'Ordered List',
          heading: 'Heading',
          h1: 'Header 1',
          h2: 'Header 2',
          h3: 'Header 3',
          h4: 'Header 4',
          h5: 'Header 5',
          h6: 'Header 6',
          align_left: 'Left Align',
          align_center: 'Center Align',
          align_right: 'Right Align',
          align_justify: 'Justify',
          text_color: 'Text Color',
          background_color: 'Background Color',

          // popups, forms, others...
          url: 'URL',
          text: 'Text',
          openInNewTab: 'Open in new tab',
          insert: 'Insert',
          altText: 'Alt Text',
          title: 'Title',
          remove: 'Remove',
          enterValidUrl: 'Please enter a valid URL',
        },
      }),
    ),
  ],
};
