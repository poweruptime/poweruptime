import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatMiniFabButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {NgIcon} from '@ng-icons/core';
import {ThemeService} from 'dfx-theme';

import {themeOptions} from '@app/util';

@Component({
  template: `
    <button [matMenuTriggerFor]="menu" type="button" mat-mini-fab>
      <ng-icon name="bootstrapPaintBucket" size="20" />
    </button>
    @let selectedTheme = themeService.theme();
    <mat-menu #menu="matMenu">
      @for (theme of themeOptions; track theme.value) {
        <button (click)="themeService.setTheme(theme.value)" type="button" mat-menu-item>
          <!-- i(bootstrapCheckCircleFill, bootstrapCircle) -->
          <ng-icon
            [name]="
              selectedTheme === theme.value ? 'bootstrapCheckCircleFill' : 'bootstrapCircle'
            " />
          <span>{{ theme.viewValue }}</span>

          <ng-icon [name]="theme.icon" />
        </button>
      }
    </mat-menu>
  `,
  selector: 'pu-outside-theme-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuTrigger, MatMenu, NgIcon, MatMenuItem, MatMiniFabButton],
})
export class OutsideThemeSwitch {
  readonly themeOptions = themeOptions;
  readonly themeService = inject(ThemeService);
}
