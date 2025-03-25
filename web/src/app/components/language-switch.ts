import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatMiniFabButton} from '@angular/material/button';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';

import {TranslocoService} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

@Component({
  template: `
    <div class="fixed bottom-4 right-16">
      <button [matMenuTriggerFor]="languageMenu" mat-mini-fab>
        <bi name="translate" size="20" />
      </button>
    </div>
    @let selectedLang = translocoService.getActiveLang();
    <mat-menu #languageMenu="matMenu" yPosition="above">
      @for (language of translocoService.getAvailableLangs(); track $any(language).id) {
        @let lang = $any(language);
        <button (click)="translocoService.setActiveLang(lang.id)" mat-menu-item>
          <div class="inline-flex items-center gap-2">
            <bi [name]="selectedLang === lang.id ? 'check-circle-fill' : 'circle'" size="16" />
            <span>{{ lang.label }}</span>
          </div>
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
