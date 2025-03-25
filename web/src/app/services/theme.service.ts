import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import {PLATFORM_ID, effect, inject, linkedSignal, signal} from '@angular/core';

import {BiName} from 'dfx-bootstrap-icons';
import {injectWindow} from 'dfx-helper';
import {createInjectable} from 'ngxtension/create-injectable';
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

export const ThemeService = createInjectable(() => {
  const window = injectWindow();
  const document = inject(DOCUMENT);
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  const getPreferredTheme = () => {
    if (window?.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else {
      return 'light';
    }
  };

  const selectedTheme = isBrowser
    ? injectLocalStorage<Themes>('pu_theme', {
        defaultValue: 'system',
      })
    : signal<Themes>('dark');

  window?.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (selectedTheme() === 'system') {
      currentTheme.set(getPreferredTheme());
    }
  });

  const currentTheme = linkedSignal({
    source: selectedTheme,
    computation: (theme: Themes) => {
      if (theme === 'system') {
        return getPreferredTheme();
      }
      return theme;
    },
  });

  effect(() => {
    if (currentTheme() === 'light') {
      document.getElementById('body')?.classList?.remove('dark');
    } else {
      document.getElementById('body')?.classList?.add('dark');
    }
  });

  return {selectedTheme, currentTheme: currentTheme.asReadonly()};
});
