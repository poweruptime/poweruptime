import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, effect, inject, linkedSignal} from '@angular/core';
import {MatIconButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {BiComponent, BiName} from 'dfx-bootstrap-icons';
import {injectWindow} from 'dfx-helper';
import {createInjectable} from 'ngxtension/create-injectable';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

type Themes = 'dark' | 'light' | 'system';

@Component({
  template: `
    <button [matMenuTriggerFor]="menu" mat-icon-button>
      <bi name="paint-bucket" size="20" />
    </button>
    <mat-menu #menu="matMenu">
      @for (theme of themeOptions; track theme.value) {
        @let selectedTheme = themeService.selectedTheme();

        <button (click)="themeService.selectedTheme.set(theme.value)" mat-menu-item>
          <div class="inline-flex items-center gap-2">
            <bi [name]="selectedTheme === theme.value ? 'check-circle-fill' : 'circle'" size="16" />
            <span>{{ theme.viewValue }}</span>

            <bi [name]="theme.icon" />
          </div>
        </button>
      }
    </mat-menu>
  `,
  selector: 'pu-theme-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconButton, MatMenuTrigger, MatMenu, BiComponent, MatMenuItem],
})
export class ThemeSwitch {
  themeOptions = [
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

  readonly themeService = inject(ThemeService);
}

export const ThemeService = createInjectable(() => {
  const window = injectWindow();
  const document = inject(DOCUMENT);

  const getPreferredTheme = () => {
    if (window?.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else {
      return 'light';
    }
  };

  const selectedTheme = injectLocalStorage<Themes>('pu_theme', {
    defaultValue: 'system',
  });

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
