import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {Router, RouterOutlet} from '@angular/router';

import {BreakpointObserver} from '@angular/cdk/layout';

import {map} from 'rxjs';

import {HlmSidebarInset} from '@spartan-ng/helm/sidebar';

import {BackendOfflineAlert} from '@app/components';
import {Sidebar} from '@app/components/sidebar/sidebar';
import {SiteHeader} from '@app/components/sidebar/site-header';
import {BackendOfflineService, PushService, SelectedTeamStore} from '@app/services';
import {isMobileBreakpoints} from '@app/services/util';

@Component({
  selector: 'home-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pu-sidebar [teamId]="selectedTeamStore.storageSelectedTeamId()">
      <main class="px-3" hlmSidebarInset>
        <pu-site-header-inset />

        <div class="main-content max-w-full">
          @defer (when backendOfflineService.isOffline()) {
            @if (backendOfflineService.isOffline()) {
              <pu-backend-offline-alert />
            }
          }

          <router-outlet />
        </div>
      </main>
    </pu-sidebar>
  `,
  styles: `
    @reference "#styles.css";

    @media (min-width: 2283px) {
      .main-content {
        @apply mx-auto max-w-[1960px] min-w-[1960px];
      }
    }
  `,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    BackendOfflineAlert,
    Sidebar,
    SiteHeader,
    HlmSidebarInset,
  ],
})
export class HomeLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
  readonly selectedTeamStore = inject(SelectedTeamStore);

  teamId = input(undefined, {
    transform: (it: string | undefined) => {
      if (it) {
        this.selectedTeamStore.storageSelectedTeamId.set(it);
      }
      return it;
    },
  });

  constructor() {
    this.selectedTeamStore.loadSelectedTeam(this.selectedTeamStore.storageSelectedTeamId);

    inject(PushService).monitorStatusChange$.pipe(takeUntilDestroyed()).subscribe();

    const router = inject(Router);

    inject(BreakpointObserver)
      .observe(isMobileBreakpoints)
      .pipe(map((result) => result.matches))
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
