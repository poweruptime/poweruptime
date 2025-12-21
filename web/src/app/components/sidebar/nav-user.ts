import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {MatDialog} from '@angular/material/dialog';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {ThemeService} from '@slateui/theme';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';

import {AboutDialog} from '@app/components/about-dialog';
import {AuthStore, ProfileStore} from '@app/services';
import {themeOptions} from '@app/util';

@Component({
  selector: 'pu-nav-user',
  imports: [
    HlmSidebarImports,
    HlmAvatarImports,
    NgIcon,
    HlmDropdownMenuImports,
    TranslocoPipe,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul hlmSidebarMenu>
      <li hlmSidebarMenuItem>
        <button
          [hlmDropdownMenuTrigger]="menu"
          [side]="_menuSide()"
          type="button"
          hlmSidebarMenuButton
          size="lg"
          align="end">
          <hlm-avatar class="rounded-lg">
            <span class="bg-muted text-muted-foreground rounded-lg" hlmAvatarFallback>
              {{ profileInitials() ?? 'UK' }}
            </span>
          </hlm-avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ profileStore.name() }}</span>
            <span class="truncate text-xs">{{ profileStore.email() }}</span>
          </div>
          <ng-icon class="ml-auto text-base" name="bootstrapGear" />
        </button>
      </li>
    </ul>

    <ng-template #menu>
      <hlm-dropdown-menu class="min-w-56 rounded-lg">
        <hlm-dropdown-menu-label>
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <hlm-avatar class="rounded-lg">
              <span class="bg-muted text-muted-foreground rounded-lg" hlmAvatarFallback>
                {{ profileInitials() ?? 'UK' }}
              </span>
            </hlm-avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ profileStore.name() }}</span>
              <span class="truncate text-xs">{{ profileStore.email() }}</span>
            </div>
          </div>
        </hlm-dropdown-menu-label>
        <hlm-dropdown-menu-separator />
        <hlm-dropdown-menu-group>
          <button (click)="openAbout()" type="button" hlmDropdownMenuItem>
            <ng-icon name="bootstrapInfoCircle" />
            {{ 'general.about' | transloco }}
          </button>
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <hlm-dropdown-menu-group>
          <button type="button" hlmDropdownMenuItem routerLink="/profile">
            <ng-icon name="bootstrapGear" />
            {{ 'profile.settings' | transloco }}
          </button>
          <button
            [hlmDropdownMenuTrigger]="themeMenu"
            type="button"
            hlmDropdownMenuItem
            side="right"
            align="start">
            <ng-icon name="bootstrapPaintBucket" />
            {{ 'general.theme' | transloco }}
            <hlm-dropdown-menu-item-sub-indicator />
          </button>
          <button
            [hlmDropdownMenuTrigger]="languageMenu"
            hlmDropdownMenuItem
            type="button"
            side="right"
            align="start">
            <ng-icon name="bootstrapTranslate" />
            {{ 'general.language' | transloco }}
            <hlm-dropdown-menu-item-sub-indicator />
          </button>
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <button (click)="authStore.logout()" type="button" hlmDropdownMenuItem>
          <ng-icon name="lucideLogOut" />
          {{ 'general.logout' | transloco }}
        </button>
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
            <ng-icon class="ms-2" [name]="theme.icon" />
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
  `,
})
export class NavUser {
  private readonly sidebarService = inject(HlmSidebarService);
  private readonly dialog = inject(MatDialog);
  protected readonly themeService = inject(ThemeService);
  protected readonly translocoService = inject(TranslocoService);
  protected readonly profileStore = inject(ProfileStore);
  protected readonly authStore = inject(AuthStore);

  protected readonly themeOptions = themeOptions;

  protected readonly _menuSide = computed(() => (this.sidebarService.isMobile() ? 'top' : 'right'));
  protected profileInitials = computed(() => getInitials(this.profileStore.name()));

  openAbout() {
    this.dialog.open(AboutDialog);
  }
}

function getInitials(text?: string) {
  if (!text) {
    return undefined;
  }
  const words = text.split(' ');
  let initials = '';

  if (words.length === 1) {
    // Only one word, return the first letter in uppercase
    initials = words[0].charAt(0).toUpperCase();
  } else {
    // Multiple words, return the first two letters in uppercase
    for (let i = 0; i < Math.min(2, words.length); i++) {
      initials += words[i].charAt(0).toUpperCase();
    }
  }

  return initials;
}
