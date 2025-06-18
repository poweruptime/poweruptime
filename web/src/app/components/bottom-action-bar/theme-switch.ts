import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatMiniFabButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {BiComponent} from 'dfx-bootstrap-icons';

import {ThemeService, themeOptions} from '@app/services/theme.service';

@Component({
  template: `
    <button [matMenuTriggerFor]="menu" type="button" mat-mini-fab>
      <bi name="paint-bucket" size="20" />
    </button>
    @let selectedTheme = themeService.selectedTheme();
    <mat-menu #menu="matMenu">
      @for (theme of themeOptions; track theme.value) {
        <button (click)="themeService.selectedTheme.set(theme.value)" type="button" mat-menu-item>
          <bi [name]="selectedTheme === theme.value ? 'check-circle-fill' : 'circle'" />
          <span>{{ theme.viewValue }}</span>

          <bi [name]="theme.icon" />
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
