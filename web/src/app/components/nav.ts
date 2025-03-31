import {BreakpointObserver} from '@angular/cdk/layout';
import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatListItem, MatNavList} from '@angular/material/list';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatTooltip} from '@angular/material/tooltip';
import {RouterLink, RouterLinkActive} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {BiComponent, provideBi, withSize} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {AboutDialog} from '@app/components/about-dialog';
import {NavTeamSelect} from '@app/components/nav-team-select';
import {IsSystemAdmin} from '@app/directives';
import {AuthStore, ProfileStore, SelectedTeamStore} from '@app/services';
import {ThemeService, themeOptions} from '@app/services/theme.service';
import {isMobileBreakpoints} from '@app/services/util';

@Component({
  template: `
    @let _isMobile = isMobile();
    <div class="flex h-full flex-col">
      <div class="flex flex-col gap-3 px-2 py-2">
        <pu-nav-team-select [teamId]="teamId()" />
        <mat-nav-list>
          <a [routerLink]="_isMobile ? '/mm' : '/m'" mat-list-item routerLinkActive="active">
            <bi name="lightning" />
            <span class="nav-text">{{ 'nav.personalDashboard' | transloco }}</span>
          </a>

          <a
            [routerLinkActiveOptions]="{exact: true}"
            mat-list-item
            routerLink="/t"
            routerLinkActive="active">
            <bi name="people" />
            <span class="nav-text">
              {{ 'general.teams' | transloco }}
            </span>
          </a>

          <div class="ps-4">
            @for (team of selectedTeamStore.onceSelectedTeamsCut(); track team.id) {
              <a
                routerLink="/t/{{ team.id }}/{{ _isMobile ? 'mm' : 'm' }}"
                mat-list-item
                routerLinkActive="active">
                <div class="flex items-center justify-between">
                  <span class="nav-text">
                    {{ team.name }}
                  </span>
                  <button
                    (click)="$event.preventDefault(); selectedTeamStore.removeSelectedTeam(team.id)"
                    mat-icon-button
                    stopPropagation>
                    <bi name="x" />
                  </button>
                </div>
              </a>
            }
          </div>

          <div class="mb-2 mt-4 flex items-center gap-3">
            <hr class="border-reef-gray-200 dark:border-reef-gray-500 w-10" />
            <span class="whitespace-nowrap break-keep">
              @if (selectedTeamStore.selectedTeam(); as selectedTeam) {
                {{ selectedTeam.name }}
              } @else {
                {{ 'general.team' | transloco }}
              }
            </span>
            <hr class="border-reef-gray-200 dark:border-reef-gray-500 w-full" />
          </div>

          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/notification-methods"
            routerLinkActive="active">
            <bi name="bell" />
            <span class="nav-text">{{ 'general.notificationMethods' | transloco }}</span>
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/status-pages"
            routerLinkActive="active">
            <bi name="chat-left-quote" />
            <span class="nav-text">{{ 'general.statusPages' | transloco }}</span>
          </a>
          <a
            mat-list-item
            routerLink="/t/{{ selectedTeamId() }}/recycle-bin"
            routerLinkActive="active">
            <bi name="trash3" />
            <span class="nav-text">{{ 'general.recycleBin' | transloco }}</span>
          </a>
          <a mat-list-item routerLink="/t/{{ selectedTeamId() }}/edit" routerLinkActive="active">
            <bi name="gear-wide" />
            <span class="nav-text">{{ 'general.settings' | transloco }}</span>
          </a>
        </mat-nav-list>
      </div>
      <div class="mt-auto px-2">
        <hr class="border-reef-gray-200 dark:border-reef-gray-500" />
        <div class="flex min-h-16 items-center justify-between pt-2">
          <mat-nav-list>
            <a *isSystemAdmin mat-list-item routerLink="/settings" routerLinkActive="active">
              <bi name="building-gear" />
              <span class="nav-text">{{ 'nav.instanceSettings' | transloco }}</span>
            </a>
          </mat-nav-list>
          <div
            class="hover:cursor-pointer"
            [matTooltip]="'general.settings' | transloco"
            [matMenuTriggerFor]="menu"
            matTooltipPosition="left">
            @if (profileInitials(); as initials) {
              <div
                class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 p-4 text-sm tracking-widest text-black dark:bg-slate-800 dark:text-white">
                {{ initials }}
              </div>
            } @else {
              <bi name="gear" />
            }
          </div>
          <mat-menu #menu="matMenu" yPosition="above" xPosition="before">
            <button (click)="authStore.logout()" mat-menu-item>
              <bi name="box-arrow-left" />
              {{ 'general.logout' | transloco }}
            </button>
            <button (click)="openAbout()" mat-menu-item>
              <bi name="info-circle" />
              {{ 'general.about' | transloco }}
            </button>
            <button [matMenuTriggerFor]="themeMenu" mat-menu-item>
              <bi name="paint-bucket" />
              {{ 'general.theme' | transloco }}
            </button>
            <button [matMenuTriggerFor]="languageMenu" mat-menu-item>
              <bi name="translate" />
              {{ 'general.language' | transloco }}
            </button>
            <button mat-menu-item routerLink="/profile/overview">
              <bi name="gear" />
              {{ 'profile.settings' | transloco }}
            </button>
          </mat-menu>

          @let selectedTheme = themeService.selectedTheme();
          <mat-menu #themeMenu="matMenu" yPosition="above">
            @for (theme of themeOptions; track theme.value) {
              <button (click)="themeService.selectedTheme.set(theme.value)" mat-menu-item>
                <div class="inline-flex items-center gap-2">
                  <bi
                    [name]="selectedTheme === theme.value ? 'check-circle-fill' : 'circle'"
                    size="16" />
                  <span>{{ theme.viewValue }}</span>

                  <bi [name]="theme.icon" />
                </div>
              </button>
            }
          </mat-menu>

          @let selectedLang = translocoService.getActiveLang();
          <mat-menu #languageMenu="matMenu" yPosition="above">
            @for (language of translocoService.getAvailableLangs(); track $any(language).id) {
              @let lang = $any(language);
              <button (click)="translocoService.setActiveLang(lang.id)" mat-menu-item>
                <div class="inline-flex items-center gap-2">
                  <bi
                    [name]="selectedLang === lang.id ? 'check-circle-fill' : 'circle'"
                    size="16" />
                  <span>{{ lang.label }}</span>
                </div>
              </button>
            }
          </mat-menu>
        </div>
      </div>
    </div>
  `,
  styles: `
    .active {
      @apply bg-neutral-100 dark:bg-neutral-800;

      .nav-text {
        @apply font-semibold;
      }
    }
  `,
  selector: 'pu-nav',
  providers: [provideBi(withSize('20'))],
  imports: [
    MatListItem,
    RouterLink,
    RouterLinkActive,
    MatNavList,
    NavTeamSelect,
    IsSystemAdmin,
    BiComponent,
    MatTooltip,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    TranslocoPipe,
    MatIconButton,
    StopPropagationDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Nav {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly profileStore = inject(ProfileStore);
  readonly authStore = inject(AuthStore);
  readonly themeService = inject(ThemeService);
  readonly dialog = inject(MatDialog);
  readonly translocoService = inject(TranslocoService);

  readonly themeOptions = themeOptions;

  selectedTeamId = computed(() => this.selectedTeamStore.selectedTeamId() ?? 'selectedTeamId');
  profileInitials = computed(() => getInitials(this.profileStore.name()));

  teamId = input<string>();

  isMobile = toSignal(
    inject(BreakpointObserver)
      .observe(isMobileBreakpoints)
      .pipe(map((result) => result.matches)),
    {requireSync: true},
  );

  openAbout() {
    this.dialog.open(AboutDialog);
  }
}

function getInitials(text?: string): string | undefined {
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
