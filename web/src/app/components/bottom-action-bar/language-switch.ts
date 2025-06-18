import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatMiniFabButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {TranslocoService} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

@Component({
  template: `
    <button [matMenuTriggerFor]="languageMenu" type="button" mat-mini-fab>
      <bi name="translate" size="20" />
    </button>
    @let selectedLang = translocoService.getActiveLang();
    <mat-menu #languageMenu="matMenu" yPosition="above">
      @for (language of translocoService.getAvailableLangs(); track $any(language).id) {
        @let lang = $any(language);
        <button (click)="translocoService.setActiveLang(lang.id)" type="button" mat-menu-item>
          <bi [name]="selectedLang === lang.id ? 'check-circle-fill' : 'circle'" />
          <span>{{ lang.label }}</span>
        </button>
      }
    </mat-menu>
  `,
  selector: 'pu-outside-language-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuTrigger, MatMenu, BiComponent, MatMenuItem, MatMiniFabButton],
})
export class OutsideLanguageSwitch {
  readonly translocoService = inject(TranslocoService);
}
