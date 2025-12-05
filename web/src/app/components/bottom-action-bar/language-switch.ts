import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatMiniFabButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';

@Component({
  template: `
    <button [matMenuTriggerFor]="languageMenu" type="button" mat-mini-fab>
      <ng-icon name="bootstrapTranslate" size="20" />
    </button>
    @let selectedLang = translocoService.getActiveLang();
    <mat-menu #languageMenu="matMenu" yPosition="above">
      @for (language of translocoService.getAvailableLangs(); track $any(language).id) {
        @let lang = $any(language);
        <button (click)="translocoService.setActiveLang(lang.id)" type="button" mat-menu-item>
          <!-- i(bootstrapCheckCircleFill, bootstrapCircle) -->
          <ng-icon
            [name]="selectedLang === lang.id ? 'bootstrapCheckCircleFill' : 'bootstrapCircle'" />
          <span>{{ lang.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  selector: 'pu-outside-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuTrigger, MatMenu, NgIcon, MatMenuItem, MatMiniFabButton],
})
export class OutsideLanguageSwitch {
  readonly translocoService = inject(TranslocoService);
}
