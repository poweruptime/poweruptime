import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {InitialsPipe} from '@spartan-ng/brain/avatar';
import {HlmAvatarImports} from '@spartan-ng/helm/avatar';
import {HlmDialogService} from '@spartan-ng/helm/dialog';
import {HlmDropdownMenuImports} from '@spartan-ng/helm/dropdown-menu';
import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';
import {ThemeService} from 'dfx-theme';

import {AuthStore, InfoStore, ProfileStore} from '@app/services';
import {environment, themeOptions} from '@app/util';

import {AboutDialog} from '../_dialog/about-dialog';

@Component({
  template: `
    @let profileInitials = this.profileStore.name() ?? 'U K' | initials;
    <ul hlmSidebarMenu>
      <li hlmSidebarMenuItem>
        <button
          id="profile-menu-button"
          [hlmDropdownMenuTrigger]="menu"
          [side]="_menuSide()"
          type="button"
          hlmSidebarMenuButton
          closeMobileSidebarOnClick="false"
          size="lg"
          align="end">
          <div class="relative">
            <hlm-avatar class="rounded-lg after:rounded-lg">
              <span class="bg-muted text-muted-foreground rounded-lg" hlmAvatarFallback>
                {{ profileInitials ?? 'UK' }}
              </span>
            </hlm-avatar>
            @if (infoStore.support(); as support) {
              @if (support.supportsSince && support.showSupportBadge) {
                <ng-icon
                  class="absolute -top-2 -left-1 -rotate-25 text-yellow-500"
                  size="16"
                  name="lucideCrown"
                  aria-label="Crown" />
              }
            }
          </div>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ profileStore.name() }}</span>
            <span class="truncate text-xs">{{ profileStore.email() }}</span>
          </div>
          <ng-icon class="ml-auto text-[length:--spacing(6)]" name="bootstrapGear" />
        </button>
      </li>
    </ul>

    <ng-template #menu>
      <hlm-dropdown-menu class="min-w-56 rounded-lg" data-id="profile-menu">
        @if (profileStore.email(); as email) {
          <hlm-dropdown-menu-label>
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <hlm-avatar class="rounded-lg">
                <span class="bg-muted text-muted-foreground rounded-lg" hlmAvatarFallback>
                  {{ profileInitials ?? 'UK' }}
                </span>
              </hlm-avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">{{ profileStore.name() }}</span>
                <span class="truncate text-xs">{{ email }}</span>
              </div>
            </div>
          </hlm-dropdown-menu-label>
          <hlm-dropdown-menu-separator />
        }
        <hlm-dropdown-menu-group>
          <button (click)="openAbout()" type="button" hlmDropdownMenuItem>
            <ng-icon class="text-[length:--spacing(4)]" name="bootstrapInfoCircle" />
            {{ 'general.about' | transloco }}
          </button>
          @if (environment.channel === 'dev') {
            <button type="button" routerLink="/dev" hlmDropdownMenuItem>
              <ng-icon class="text-[length:--spacing(4)]" name="bootstrapCodeSlash" />
              {{ 'profile.devThings' | transloco }}
            </button>
          }
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <hlm-dropdown-menu-group>
          <button type="button" hlmDropdownMenuItem routerLink="/profile">
            <ng-icon class="text-[length:--spacing(4)]" name="bootstrapGear" />
            {{ 'profile.settings' | transloco }}
          </button>
          <button
            [hlmDropdownMenuTrigger]="themeMenu"
            type="button"
            hlmDropdownMenuItem
            side="right"
            align="start">
            <ng-icon class="text-[length:--spacing(4)]" name="bootstrapPaintBucket" />
            {{ 'general.theme' | transloco }}
            <hlm-dropdown-menu-item-sub-indicator />
          </button>
          <button
            [hlmDropdownMenuTrigger]="languageMenu"
            hlmDropdownMenuItem
            type="button"
            side="right"
            align="start">
            <ng-icon class="text-[length:--spacing(4)]" name="bootstrapTranslate" />
            {{ 'general.language' | transloco }}
            <hlm-dropdown-menu-item-sub-indicator />
          </button>
        </hlm-dropdown-menu-group>
        <hlm-dropdown-menu-separator />
        <button (click)="authStore.logout()" type="button" hlmDropdownMenuItem>
          <ng-icon class="text-[length:--spacing(4)]" name="lucideLogOut" />
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
            <ng-icon class="ms-2 text-[length:--spacing(4)]" [name]="theme.icon" />
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
  selector: 'pu-nav-user',
  imports: [
    HlmSidebarImports,
    HlmAvatarImports,
    NgIcon,
    HlmDropdownMenuImports,
    TranslocoPipe,
    RouterLink,
    InitialsPipe,
    InitialsPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavUser {
  protected readonly environment = environment;

  private readonly sidebarService = inject(HlmSidebarService);
  private readonly dialog = inject(HlmDialogService);
  protected readonly themeService = inject(ThemeService);
  protected readonly translocoService = inject(TranslocoService);
  protected readonly profileStore = inject(ProfileStore);
  protected readonly authStore = inject(AuthStore);
  protected readonly infoStore = inject(InfoStore);

  protected readonly themeOptions = themeOptions;

  protected readonly _menuSide = computed(() => (this.sidebarService.isMobile() ? 'top' : 'right'));

  constructor() {
    this.infoStore.loadSupport();
  }
  protected openAbout() {
    this.dialog.open(AboutDialog, {
      showCloseButton: false,
    });
  }
}
