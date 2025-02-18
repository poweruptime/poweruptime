import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconAnchor, MatIconButton} from '@angular/material/button';
import {MatDrawer, MatSidenavModule} from '@angular/material/sidenav';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';

import {filter, map, skip, withLatestFrom} from 'rxjs';

import {BiComponent} from 'dfx-bootstrap-icons';
import {injectLocalStorage} from 'ngxtension/inject-local-storage';

import {Nav, ThemeSwitch} from '@app/components';
import {CmdkOverlay} from '@app/components/cmdk/cmdk-overlay';
import {PushService, SelectedTeamStore} from '@app/services';

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
        <pu-nav [teamId]="teamId()" />
      </mat-drawer>

      <mat-drawer-content class="grid-container">
        <header class="header">
          <div class="flex justify-between gap-4 p-2">
            <div class="flex flex-row items-center gap-4">
              <button (click)="drawer.toggle()" mat-icon-button aria-label="Toggle side nav">
                <bi name="list" size="24" />
              </button>
              <a routerLink="/">
                <h1>poweruptime</h1>
              </a>
            </div>
            <div class="inline-flex items-center gap-2">
              <pu-cmdk-overlay [(hasUsedShortcut)]="hasUsedCmdkShortcut" />
              <pu-theme-switch style="height: 40px" />
              <a mat-icon-button routerLink="/profile">
                <bi name="gear" />
              </a>
            </div>
          </div>
        </header>

        <main class="main">
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
      @apply overflow-y-auto px-4 pt-4;
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
    ThemeSwitch,
    MatIconAnchor,
  ],
})
export class HomeLayout {
  selectedTeamStore = inject(SelectedTeamStore);

  teamId = input<string>();

  drawer = viewChild.required(MatDrawer);

  isMobile$ = inject(BreakpointObserver)
    .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large])
    .pipe(map((result) => result.matches));

  isMobile = toSignal(this.isMobile$, {requireSync: true});

  hasUsedCmdkShortcut = injectLocalStorage<number>('pu_cmdk_used_shortcut', {
    defaultValue: 0,
    storageSync: true,
  });

  constructor() {
    this.selectedTeamStore.loadSelectedTeam(this.teamId);

    const pushService = inject(PushService);
    const availableTeams = inject(SelectedTeamStore).entities;
    const availableTeamIds = computed(() => {
      const selectedTeamId = this.selectedTeamStore.selectedTeamId();

      return selectedTeamId ? [selectedTeamId] : availableTeams().map((team) => team.id);
    });

    pushService.setTeamIds(availableTeamIds);
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
