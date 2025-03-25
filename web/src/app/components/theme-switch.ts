import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatMiniFabButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {BiComponent} from 'dfx-bootstrap-icons';

import {ThemeService, themeOptions} from '@app/services/theme.service';

@Component({
  template: `
    <div class="fixed bottom-4 right-4">
      <button [matMenuTriggerFor]="menu" mat-mini-fab>
        <bi name="paint-bucket" size="20" />
      </button>
    </div>
    @let selectedTheme = themeService.selectedTheme();
    <mat-menu #menu="matMenu">
      @for (theme of themeOptions; track theme.value) {
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
  selector: 'pu-outside-theme-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuTrigger, MatMenu, BiComponent, MatMenuItem, MatMiniFabButton],
})
export class OutsideThemeSwitch {
  readonly themeOptions = themeOptions;
  readonly themeService = inject(ThemeService);
}
