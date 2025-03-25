import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {ChangeDetectionStrategy, Component, inject, input, viewChild} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {MatTooltip} from '@angular/material/tooltip';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';

import {filter, map, skip, withLatestFrom} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {BackendOfflineAlert, Nav} from '@app/components';
import {CmdkOverlay} from '@app/components/cmdk/cmdk-overlay';
import {BackendOfflineService, PushService, SelectedTeamStore} from '@app/services';

@Component({
  selector: 'home-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let _isMobile = isMobile();

    <mat-drawer-container class="dashboard-container" autosize>
      <mat-drawer
        class="sidenav"
        #drawer
        [mode]="_isMobile ? 'over' : 'side'"
        [opened]="!_isMobile">
        <pu-nav [teamId]="storageTeamId()" />
      </mat-drawer>

      <mat-drawer-content class="grid-container">
        <header class="header">
          <div class="flex justify-between gap-4 p-2">
            <div class="flex items-center gap-4">
              <div class="flex items-center" [class.hidden]="!_isMobile">
                <button
                  [matTooltip]="'nav.toggle' | transloco"
                  [attr.aria-label]="'nav.toggle' | transloco"
                  (click)="drawer.toggle()"
                  mat-icon-button>
                  <bi name="list" size="24" />
                </button>
              </div>
              <a class="pb-1" routerLink="/">
                <h1 class="text-2xl">poweruptime</h1>
              </a>
            </div>
            <div class="inline-flex items-center gap-2">
              <pu-cmdk-overlay [(hasUsedShortcut)]="hasUsedCmdkShortcut" />
            </div>
          </div>
        </header>

        <main class="main">
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
    .dashboard-container {
      @apply h-screen w-screen;
    }

    .grid-container {
      margin: 0;
      display: grid;
      grid-template-rows: 64px 1fr auto; /* Header, Main, Footer */
      min-height: 100vh;
    }

    .header {
      @apply shadow-sm dark:text-white;
      z-index: 999;
      grid-row: 1;
    }

    .main {
      @apply overflow-y-auto px-2 pt-2;
      max-width: 1920px;
      height: 100%;
      grid-row: 2;

      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }

    /* Hide scrollbar but allow scrolling */
    .main::-webkit-scrollbar {
      display: none; /* Chrome, Safari, Edge */
    }
  `,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    RouterLink,
    MatSidenavModule,
    BiComponent,
    MatIconButton,
    Nav,
    CmdkOverlay,
    MatTooltip,
    TranslocoPipe,
    BackendOfflineAlert,
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

  readonly isMobile$ = inject(BreakpointObserver)
    .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large])
    .pipe(map((result) => result.matches));

  readonly isMobile = toSignal(this.isMobile$, {requireSync: true});

  readonly hasUsedCmdkShortcut = injectLocalStorage<number>('pu_cmdk_used_shortcut', {
    defaultValue: 0,
    storageSync: true,
  });

  constructor() {
    this.selectedTeamStore.loadSelectedTeam(this.storageTeamId);

    const pushService = inject(PushService);

    pushService.monitorStatusChange$.pipe(takeUntilDestroyed()).subscribe();

    inject(Router)
      .events.pipe(
        takeUntilDestroyed(),
        withLatestFrom(this.isMobile$),
        filter(([a, b]) => b && a instanceof NavigationEnd),
      )
      .subscribe(() => this.drawer().close());

    this.isMobile$.pipe(skip(1), takeUntilDestroyed()).subscribe((isMobile) => {
      if (isMobile) {
        void this.drawer().close();
      } else {
        void this.drawer().open('program');
      }
    });
  }
}
