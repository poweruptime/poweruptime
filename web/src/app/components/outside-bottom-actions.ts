import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogService} from '@spartan-ng/helm/dialog';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {ThemeService} from 'dfx-theme';

import {AboutDialog, HelpDialog} from '@app/components/index';
import {themeOptions} from '@app/util';

@Component({
  template: `
    <div class="fixed right-4 bottom-4">
      <button [hlmDropdownMenuTrigger]="menu" align="end" type="button" hlmBtn size="lg">
        <ng-icon name="bootstrapThreeDots" hlm />
      </button>
      <ng-template #menu>
        <hlm-dropdown-menu class="min-w-56 rounded-lg">
          <hlm-dropdown-menu-group>
            <button (click)="openAbout()" type="button" hlmDropdownMenuItem>
              <ng-icon hlm size="sm" name="bootstrapInfoCircle" />
              {{ 'general.about' | transloco }}
            </button>
            <button (click)="openHelp()" type="button" hlmDropdownMenuItem>
              <ng-icon hlm size="sm" name="bootstrapQuestionCircle" />
              {{ 'general.help' | transloco }}
            </button>
          </hlm-dropdown-menu-group>
          <hlm-dropdown-menu-separator />
          <hlm-dropdown-menu-group>
            <button
              [hlmDropdownMenuTrigger]="themeMenu"
              type="button"
              hlmDropdownMenuItem
              side="right"
              align="start">
              <ng-icon hlm size="sm" name="bootstrapPaintBucket" />
              {{ 'general.theme' | transloco }}
              <hlm-dropdown-menu-item-sub-indicator />
            </button>
            <button
              [hlmDropdownMenuTrigger]="languageMenu"
              hlmDropdownMenuItem
              type="button"
              side="right"
              align="start">
              <ng-icon hlm size="sm" name="bootstrapTranslate" />
              {{ 'general.language' | transloco }}
              <hlm-dropdown-menu-item-sub-indicator />
            </button>
          </hlm-dropdown-menu-group>
        </hlm-dropdown-menu>
      </ng-template>

      @let selectedTheme = themeService.theme();
      <ng-template #themeMenu>
        <hlm-dropdown-menu-sub>
          @for (theme of themeOptions; track theme.value) {
            <button
              [checked]="selectedTheme === theme.value"
              (triggered)="themeService.setTheme(theme.value)"
              hlmDropdownMenuCheckbox
              type="button">
              <hlm-dropdown-menu-checkbox-indicator />
              {{ theme.viewValue }}
              <ng-icon class="ms-2" [name]="theme.icon" hlm size="sm" />
            </button>
          }
        </hlm-dropdown-menu-sub>
      </ng-template>

      @let selectedLang = translocoService.getActiveLang();
      <ng-template #languageMenu>
        <hlm-dropdown-menu-sub>
          @for (language of translocoService.getAvailableLangs(); track $any(language).id) {
            @let lang = $any(language);
            <button
              [checked]="selectedLang === lang.id"
              (triggered)="translocoService.setActiveLang(lang.id)"
              hlmDropdownMenuCheckbox
              type="button">
              <hlm-dropdown-menu-checkbox-indicator />
              {{ lang.label }}
            </button>
          }
        </hlm-dropdown-menu-sub>
      </ng-template>
    </div>
  `,
  selector: 'pu-outside-bottom-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmDropdownMenuImports, HlmIconImports, TranslocoPipe, HlmButtonImports],
})
export class OutsideBottomActions {
  protected readonly themeOptions = themeOptions;

  private readonly dialog = inject(HlmDialogService);
  protected readonly themeService = inject(ThemeService);
  protected readonly translocoService = inject(TranslocoService);

  protected openAbout() {
    this.dialog.open(AboutDialog);
  }

  protected openHelp() {
    this.dialog.open(HelpDialog);
  }
}
