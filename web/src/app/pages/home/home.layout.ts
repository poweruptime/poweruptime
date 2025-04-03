import {BreakpointObserver} from '@angular/cdk/layout';
import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbar} from '@angular/material/toolbar';
import {MatTooltip} from '@angular/material/tooltip';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';

import {debounceTime, filter, map, skip, withLatestFrom} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {BackendOfflineAlert, Nav} from '@app/components';
import {CmdkOverlay} from '@app/components/cmdk';
import {BackendOfflineService, PushService, SelectedTeamStore} from '@app/services';
import {TailwindBreakpoints, isMobileBreakpoints} from '@app/services/util';

@Component({
  selector: 'home-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _collapseNav = collapseNav();

    <mat-drawer-container class="h-screen w-screen" autosize>
      <mat-drawer
        class="border-r border-solid border-r-gray-400"
        #drawer
        [mode]="_collapseNav ? 'over' : 'side'"
        [opened]="!_collapseNav">
        <pu-nav [teamId]="storageTeamId()" />
      </mat-drawer>

      <mat-drawer-content class="grid-container">
        <mat-toolbar>
          @if (_collapseNav) {
            <button
              [matTooltip]="'nav.toggle' | transloco"
              [attr.aria-label]="'nav.toggle' | transloco"
              (click)="drawer.toggle()"
              mat-icon-button>
              <bi name="list" size="24" />
            </button>
          }
          <a class="ps-1" routerLink="/">poweruptime</a>
          <span class="spacer"></span>

          <div class="hidden items-center gap-2 lg:inline-flex">
            <pu-cmdk-overlay [(hasUsedShortcut)]="hasUsedCmdkShortcut" />
          </div>
        </mat-toolbar>

        <main class="main overflow-y-auto px-3">
          @defer (when backendOfflineService.isOffline()) {
            @if (backendOfflineService.isOffline()) {
              <pu-backend-offline-alert />
            }
          }

          <router-outlet />
        </main>
      </mat-drawer-content>
    </mat-drawer-container>
  `,
  styles: `
    @reference "#styles.css";

    .grid-container {
      margin: 0;
      display: grid;
      grid-template-rows: 64px 1fr auto; /* Header, Main, Footer */
      min-height: 100vh;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .main {
      max-width: 1920px;
      height: 100%;
      grid-row: 2;

      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
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
    CmdkOverlay,
    MatTooltip,
    TranslocoPipe,
    BackendOfflineAlert,
    MatToolbar,
    RouterLink,
  ],
})
export class HomeLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
  readonly selectedTeamStore = inject(SelectedTeamStore);

  teamId = input(undefined, {
    transform: (it: string | undefined) => {
      if (it) {
        this.storageTeamId.set(it);
      }
      return it;
    },
  });

  readonly storageTeamId = injectLocalStorage<string>('pu_selected_team_id');

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

  hasUsedCmdkShortcut = injectLocalStorage<number>('pu_cmdk_used_shortcut', {
    defaultValue: 0,
    storageSync: true,
  });

  constructor() {
    this.selectedTeamStore.loadSelectedTeam(this.storageTeamId);

    const pushService = inject(PushService);

    pushService.monitorStatusChange$.pipe(takeUntilDestroyed()).subscribe();

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
        debounceTime(400),
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
