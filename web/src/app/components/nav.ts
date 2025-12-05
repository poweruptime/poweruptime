import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {Router, RouterLink, RouterLinkActive} from '@angular/router';

import {MatIconButton} from '@angular/material/button';
import {MatDialog} from '@angular/material/dialog';
import {MatListItem, MatNavList} from '@angular/material/list';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatTooltip} from '@angular/material/tooltip';

import {BreakpointObserver} from '@angular/cdk/layout';

import {map} from 'rxjs';

import {ThemeService} from '@angularui/theme';
import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {StopPropagationDirective} from 'dfx-helper';

import {IsSystemAdmin, MonitorStatusText} from '@app/directives';
import {IsTeamAdmin} from '@app/directives';
import {AuthStore, InfoStore, ProfileStore, SelectedTeamStore} from '@app/services';
import {isMobileBreakpoints} from '@app/services/util';
import {themeOptions} from '@app/util';

import {AboutDialog} from './about-dialog';
import {HelpDialog} from './help-dialog';
import {TeamSelect} from './team-select';

@Component({
  template: `
    @let _isMobile = isMobile();
    <div class="flex h-full flex-col">
      <div class="flex flex-col gap-3 px-2 py-2">
        <div class="px-4">
          <pu-team-select [teamId]="teamId()" (teamIdSelected)="navigateToTeamDashboard($event)">
            <button
              class="relative flex w-full items-center justify-center rounded-full border border-gray-400 bg-white px-4 py-3 transition-all hover:cursor-pointer hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-500 active:bg-gray-200 dark:border-gray-600 dark:bg-black dark:hover:bg-gray-900 dark:focus-visible:outline-green-400 dark:active:bg-gray-800"
              type="button">
              <span class="text-center font-medium" [monitor-status-text]="'UP'">
                @if (teamId()) {
                  @if (selectedTeamStore.selectedTeam(); as selectedTeam) {
                    {{ selectedTeam.name }}
                  } @else {
                    {{ 'general.loading' | transloco }}
                  }
                } @else {
                  {{ 'nav.teamSelect.select' | transloco }}
                }
              </span>
              <span class="absolute right-4 pt-1">
                <ng-icon size="20" name="bootstrapChevronExpand" />
              </span>
            </button>
          </pu-team-select>
        </div>
        <mat-nav-list>
          <a [routerLink]="_isMobile ? '/mm' : '/m'" mat-list-item routerLinkActive="active">
            <ng-icon size="20" name="bootstrapLightning" />
            <span class="nav-text">{{ 'nav.personalDashboard' | transloco }}</span>
          </a>

          <a
            [routerLinkActiveOptions]="{exact: true}"
            mat-list-item
            routerLink="/t"
            routerLinkActive="active">
            <ng-icon size="20" name="bootstrapPeople" />
            <span class="nav-text">
              {{ 'general.teams' | transloco }}
            </span>
          </a>

          @let selectedTeam = selectedTeamStore.selectedTeam();

          <div class="ps-4">
            @for (team of selectedTeamStore.onceSelectedTeamsCut(); track team.id) {
              <a
                class="nav-item"
                routerLink="/t/{{ team.id }}/{{ _isMobile ? 'mm' : 'm' }}"
                mat-list-item
                routerLinkActive="active">
                <div class="flex items-center justify-between">
                  <span class="nav-text">
                    {{ team.name }}
                  </span>
                  <!-- Stop propagation isn't enough -->
                  <button
                    class="close-button"
                    (click)="$event.preventDefault(); selectedTeamStore.removeSelectedTeam(team.id)"
                    type="button"
                    mat-icon-button
                    stopPropagation>
                    <ng-icon size="20" name="bootstrapX" />
                  </button>
                </div>
              </a>
            }
          </div>

          @if (selectedTeam; as selectedTeam) {
            <div class="mt-4 mb-2 flex items-center gap-3">
              <hr class="border-reef-gray-200 dark:border-reef-gray-500 w-full" />
              <span class="break-keep whitespace-nowrap">
                {{ selectedTeam.name }}
              </span>
              <hr class="border-reef-gray-200 dark:border-reef-gray-500 w-full" />
            </div>

            <a
              mat-list-item
              routerLink="/t/{{ selectedTeamId() }}/notification-methods"
              routerLinkActive="active">
              <ng-icon size="20" name="bootstrapBell" />
              <span class="nav-text">{{ 'general.notificationMethods' | transloco }}</span>
            </a>
            <a
              mat-list-item
              routerLink="/t/{{ selectedTeamId() }}/status-pages"
              routerLinkActive="active">
              <ng-icon size="20" name="bootstrapChatLeftQuote" />
              <span class="nav-text">{{ 'general.statusPages' | transloco }}</span>
            </a>
            <ng-container *isTeamAdmin>
              <a
                mat-list-item
                routerLink="/t/{{ selectedTeamId() }}/recycle-bin"
                routerLinkActive="active">
                <ng-icon size="20" name="bootstrapTrash3" />
                <span class="nav-text">{{ 'general.recycleBin' | transloco }}</span>
              </a>
              <a
                mat-list-item
                routerLink="/t/{{ selectedTeamId() }}/edit"
                routerLinkActive="active">
                <ng-icon size="20" name="bootstrapGearWide" />
                <span class="nav-text">{{ 'general.settings' | transloco }}</span>
              </a>
            </ng-container>
          }
        </mat-nav-list>
      </div>
      <div class="mt-auto px-2">
        <hr class="border-reef-gray-200 dark:border-reef-gray-500" />
        <div class="flex min-h-16 items-center justify-between pt-2">
          <mat-nav-list>
            <a
              [matTooltip]="'profile.settings' | transloco"
              routerLink="/profile"
              routerLinkActive="active"
              mat-list-item
              style="padding-left: 0 !important;">
              <div
                class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-300 p-4 text-sm tracking-widest text-black dark:bg-slate-800 dark:text-white">
                {{ profileInitials() ?? 'UK' }}
              </div>
              <div class="ms-2 inline-flex gap-2">
                <span>{{ profileStore.name() ?? 'Unknown' }}</span>
                @if (infoStore.support(); as support) {
                  @if (support.showSupportBadge && support.supportsSince) {
                    <svg
                      [monitor-status-text]="'UP'"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24">
                      <!-- Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE -->
                      <path
                        fill="currentColor"
                        d="M5 20v-2h14v2zm0-3.5L3.725 8.475q-.05 0-.113.013T3.5 8.5q-.625 0-1.062-.438T2 7t.438-1.062T3.5 5.5t1.063.438T5 7q0 .175-.038.325t-.087.275L8 9l3.125-4.275q-.275-.2-.45-.525t-.175-.7q0-.625.438-1.063T12 2t1.063.438T13.5 3.5q0 .375-.175.7t-.45.525L16 9l3.125-1.4q-.05-.125-.088-.275T19 7q0-.625.438-1.063T20.5 5.5t1.063.438T22 7t-.437 1.063T20.5 8.5q-.05 0-.112-.012t-.113-.013L19 16.5z" />
                    </svg>
                  }
                }
              </div>
            </a>
          </mat-nav-list>

          <div class="inline-flex gap-1">
            <mat-nav-list>
              <a
                *isSystemAdmin
                [matTooltip]="'nav.instanceSettings' | transloco"
                mat-list-item
                routerLink="/settings"
                routerLinkActive="active">
                <ng-icon class="mt-1" size="20" name="bootstrapBuildingGear" />
              </a>
            </mat-nav-list>

            <mat-nav-list>
              <button
                [matTooltip]="'general.help' | transloco"
                (click)="openHelp()"
                type="button"
                mat-list-item>
                <ng-icon class="mt-1" size="20" name="bootstrapQuestionCircle" />
              </button>
            </mat-nav-list>

            <mat-nav-list>
              <a
                [matMenuTriggerFor]="menu"
                [matTooltip]="'general.settings' | transloco"
                mat-list-item>
                <ng-icon class="mt-1" size="20" name="bootstrapGear" />
              </a>
            </mat-nav-list>

            <mat-menu #menu="matMenu" yPosition="above" xPosition="before">
              <button (click)="authStore.logout()" type="button" mat-menu-item>
                <ng-icon name="bootstrapBoxArrowLeft" />
                {{ 'general.logout' | transloco }}
              </button>
              <button (click)="openAbout()" type="button" mat-menu-item>
                <ng-icon name="bootstrapInfoCircle" />
                {{ 'general.about' | transloco }}
              </button>
              <button [matMenuTriggerFor]="themeMenu" type="button" mat-menu-item>
                <ng-icon name="bootstrapPaintBucket" />
                {{ 'general.theme' | transloco }}
              </button>
              <button [matMenuTriggerFor]="languageMenu" type="button" mat-menu-item>
                <ng-icon name="bootstrapTranslate" />
                {{ 'general.language' | transloco }}
              </button>
            </mat-menu>

            @let selectedTheme = themeService.theme();
            <mat-menu #themeMenu="matMenu" yPosition="above">
              @for (theme of themeOptions; track theme.value) {
                <button (click)="themeService.setTheme(theme.value)" type="button" mat-menu-item>
                  <div class="inline-flex items-center gap-2">
                    <!-- i(bootstrapCheckCircleFill, bootstrapCircle) -->
                    <ng-icon
                      [name]="
                        selectedTheme === theme.value
                          ? 'bootstrapCheckCircleFill'
                          : 'bootstrapCircle'
                      "
                      size="16" />
                    <span>{{ theme.viewValue }}</span>

                    <ng-icon [name]="theme.icon" />
                  </div>
                </button>
              }
            </mat-menu>

            @let selectedLang = translocoService.getActiveLang();
            <mat-menu #languageMenu="matMenu" yPosition="above">
              @for (language of translocoService.getAvailableLangs(); track $any(language).id) {
                @let lang = $any(language);
                <button
                  (click)="translocoService.setActiveLang(lang.id)"
                  type="button"
                  mat-menu-item>
                  <!-- i(bootstrapCheckCircleFill, bootstrapCircle) -->
                  <ng-icon
                    [name]="
                      selectedLang === lang.id ? 'bootstrapCheckCircleFill' : 'bootstrapCircle'
                    " />
                  <span>{{ lang.label }}</span>
                </button>
              }
            </mat-menu>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .active {
      @apply bg-neutral-100 dark:bg-neutral-800;

      .nav-text {
        @apply font-semibold;
      }
    }

    .close-button {
      display: none;
    }

    .nav-item:hover .close-button {
      display: block;
    }
  `,
  selector: 'pu-nav',
  imports: [
    MatListItem,
    RouterLink,
    RouterLinkActive,
    MatNavList,
    IsSystemAdmin,
    NgIcon,
    MatMenu,
    MatMenuTrigger,
    MatMenuItem,
    TranslocoPipe,
    MatIconButton,
    StopPropagationDirective,
    TeamSelect,
    IsTeamAdmin,
    MonitorStatusText,
    MatTooltip,
    NgIcon,
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
  readonly router = inject(Router);
  readonly infoStore = inject(InfoStore);

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

  openHelp() {
    this.dialog.open(HelpDialog);
  }

  navigateToTeamDashboard(newTeamId: string) {
    const current = this.router.url; // e.g. "/t/abc/notification-methods"
    const teamSegmentRe = /t\/[^/;?]+/;

    if (teamSegmentRe.test(current)) {
      // replace "t/{oldId}" with "t/{newTeamId}"
      const updated = current.replace(teamSegmentRe, `t/${newTeamId}`);
      void this.router.navigateByUrl(updated);
    } else {
      // no match → go directly to "/t/{newTeamId}"
      void this.router.navigate(['/', 't', newTeamId], {
        queryParamsHandling: 'preserve',
        preserveFragment: true,
      });
    }
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
