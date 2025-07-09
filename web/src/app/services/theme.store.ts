import {isPlatformBrowser} from '@angular/common';
import {DOCUMENT, PLATFORM_ID, REQUEST, computed, effect, inject} from '@angular/core';

import {signalStore, withComputed, withHooks, withMethods, withProps} from '@ngrx/signals';
import {BiName} from 'dfx-bootstrap-icons';
import {injectWindow} from 'dfx-helper';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

type Themes = 'dark' | 'light' | 'system';

export const themeOptions = [
  {
    value: 'system',
    viewValue: 'System/Default',
    icon: 'laptop',
  },
  {
    value: 'light',
    viewValue: 'Light',
    icon: 'sun-fill',
  },
  {
    value: 'dark',
    viewValue: 'Dark',
    icon: 'moon-stars-fill',
  },
] satisfies {value: Themes; viewValue: string; icon: BiName}[];

function getPreferredTheme(window: Window | undefined) {
  if (window?.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  } else {
    return 'light';
  }
}

function getThemeOfCookies(cookieStr: string | null | undefined): string | undefined {
  if (!cookieStr) {
    return undefined;
  }

  const pairs = cookieStr.split(';').map((s) => s.trim());
  const themePair = pairs.find((p) => p.startsWith('theme='));
  if (!themePair) return undefined;
  const [, value] = themePair.split('=');
  return value || undefined;
}

export const ThemeStore = signalStore(
  {providedIn: 'root'},
  withProps(() => ({
    window: injectWindow(),
    _selectedTheme: injectLocalStorage<Themes>('pu_theme', {
      defaultValue: 'system',
    }),
  })),
  withComputed(({window, _selectedTheme}, request = inject(REQUEST)) => ({
    selectedTheme: _selectedTheme.asReadonly(),
    currentTheme: computed(() => {
      // request if only defined in SSR context
      const requestTheme = getThemeOfCookies(request?.headers.get('cookie'));
      if (requestTheme) {
        return requestTheme as 'light' | 'dark';
      }

      const it = _selectedTheme();
      if (it === 'system') {
        return getPreferredTheme(window);
      }
      return it;
    }),
  })),
  withMethods(({window, _selectedTheme}) => ({
    setTheme(it: Themes) {
      _selectedTheme.set(it);
      // always set "real" theme into cookie
      document.cookie = `theme=${it === 'system' ? getPreferredTheme(window) : it};`;
    },
  })),
  withHooks({
    onInit(
      {window, currentTheme, _selectedTheme},
      ngDocument = inject(DOCUMENT),
      platformId = inject(PLATFORM_ID),
    ) {
      if (isPlatformBrowser(platformId) && _selectedTheme() === 'system') {
        document.cookie = `theme=${getPreferredTheme(window)};`;
      }
      effect(() => {
        if (currentTheme() === 'light') {
          ngDocument.getElementById('body')?.classList?.remove('dark');
        } else {
          ngDocument.getElementById('body')?.classList?.add('dark');
        }
      });
    },
  }),
);
