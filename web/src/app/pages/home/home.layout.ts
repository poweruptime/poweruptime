import {NgOptimizedImage} from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';

import {MatIconButton} from '@angular/material/button';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbar} from '@angular/material/toolbar';
import {MatTooltip} from '@angular/material/tooltip';

import {BreakpointObserver} from '@angular/cdk/layout';

import {debounceTime, filter, map, skip, withLatestFrom} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendOfflineAlert, Nav} from '@app/components';
import {BackendOfflineService, ChangelogStore, PushService, SelectedTeamStore} from '@app/services';
import {JsonStore} from '@app/services';
import {TailwindBreakpoints, isMobileBreakpoints} from '@app/services/util';

import {environment} from '../../../environments/environment';
import {SupporterBadge} from '../../components/supporter-badge';

@Component({
  selector: 'home-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _collapseNav = collapseNav();

    <mat-drawer-container autosize>
      <mat-drawer
        class="border-r border-solid border-r-gray-400"
        #drawer
        [mode]="_collapseNav ? 'over' : 'side'"
        [opened]="!_collapseNav">
        <pu-nav [teamId]="selectedTeamStore.storageSelectedTeamId()" />
      </mat-drawer>

      <mat-drawer-content>
        <div class="flex h-screen max-h-screen flex-col gap-2">
          <mat-toolbar>
            <div class="flex w-full justify-between pt-2">
              <div class="flex items-center gap-2">
                @if (_collapseNav) {
                  <button
                    [matTooltip]="'nav.toggle' | transloco"
                    [attr.aria-label]="'nav.toggle' | transloco"
                    (click)="drawer.toggle()"
                    type="button"
                    mat-icon-button>
                    <bi name="list" size="24" />
                  </button>
                }
                <a class="inline-flex items-center gap-2 text-2xl" routerLink="/">
                  <img
                    class="rounded-full"
                    ngSrc="/assets/logo.webp"
                    alt="logo"
                    width="48"
                    height="48" />
                  <span class="mb-1">poweruptime</span>
                </a>
              </div>
              <div>
                @if (jsonStore.json(); as json) {
                  <pu-supporter-badge
                    [hide]="!json.showSupportBadge"
                    [supportsSince]="json.supportsSince" />
                }
              </div>
            </div>
          </mat-toolbar>

          <main class="main w-full overflow-y-scroll px-2 pb-2">
            @defer (when backendOfflineService.isOffline()) {
              @if (backendOfflineService.isOffline()) {
                <pu-backend-offline-alert class="mb-4" />
              }
            }

            <router-outlet />
          </main>
        </div>
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styles: `
    @reference "#styles.css";

    .main {
      max-width: 1920px;

      /*-ms-overflow-style: none; !* IE and Edge *!*/
      /*scrollbar-width: none; !* Firefox *!*/
    }

    @media (min-width: 2283px) {
      .main {
        min-width: 1924px;
        @apply mx-auto;
      }
    }

    /* Hide scrollbar but allow scrolling */
    .main::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Edge */
    }
  `,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    MatSidenavModule,
    BiComponent,
    MatIconButton,
    Nav,
    MatTooltip,
    TranslocoPipe,
    BackendOfflineAlert,
    MatToolbar,
    RouterLink,
    NgOptimizedImage,
    SupporterBadge,
  ],
})
export class HomeLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly jsonStore = inject(JsonStore);

  teamId = input(undefined, {
    transform: (it: string | undefined) => {
      if (it) {
        this.selectedTeamStore.storageSelectedTeamId.set(it);
      }
      return it;
    },
  });

  readonly drawer = viewChild.required(MatDrawer);

  readonly breakpointObserver = inject(BreakpointObserver);

  readonly collapseNav$ = this.breakpointObserver
    .observe([
      TailwindBreakpoints.xs,
      TailwindBreakpoints.sm,
      TailwindBreakpoints.md,
      TailwindBreakpoints.lg,
      TailwindBreakpoints.xl,
      TailwindBreakpoints['2xl'],
      TailwindBreakpoints['3xl'],
    ])
    .pipe(map((result) => result.matches));

  readonly collapseNav = toSignal(this.collapseNav$, {requireSync: true});

  constructor() {
    this.selectedTeamStore.loadSelectedTeam(this.selectedTeamStore.storageSelectedTeamId);

    inject(PushService).monitorStatusChange$.pipe(takeUntilDestroyed()).subscribe();

    const changelogStore = inject(ChangelogStore);
    if (changelogStore.showNewChangelog()) {
      changelogStore.load(changelogStore.lastVersion());
      changelogStore.lastVersion.set(environment.version);
    }

    const router = inject(Router);

    router.events
      .pipe(
        takeUntilDestroyed(),
        withLatestFrom(this.collapseNav$),
        filter(([a, b]) => b && a instanceof NavigationEnd),
      )
      .subscribe(() => this.drawer().close());

    this.collapseNav$.pipe(skip(1), takeUntilDestroyed()).subscribe((isMobile) => {
      if (isMobile) {
        void this.drawer().close();
      } else {
        void this.drawer().open('program');
      }
    });

    this.breakpointObserver
      .observe(isMobileBreakpoints)
      .pipe(
        takeUntilDestroyed(),
        map((result) => result.matches),
        debounceTime(275),
      )
      .subscribe((isMobile) => {
        if (!isMobile) {
          if (router.url.includes('/mm')) {
            void router.navigateByUrl(router.url.replace('/mm', '/m'));
          }
        } else {
          if (router.url.includes('/m')) {
            const index = router.url.indexOf('/m');
            if (router.url[index + 2] !== 'm') {
              void router.navigateByUrl(router.url.replace('/m', '/mm'));
            }
          }
        }
      });
  }
}
