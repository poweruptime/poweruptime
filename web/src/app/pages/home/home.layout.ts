import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {Router, RouterOutlet} from '@angular/router';

import {HlmSidebarImports, HlmSidebarService} from '@spartan-ng/helm/sidebar';

import {BackendOfflineAlert} from '@app/components';
import {Sidebar} from '@app/components/sidebar/sidebar';
import {SiteHeader} from '@app/components/sidebar/site-header';
import {
  BackendOfflineService,
  ChangelogStore,
  InfoStore,
  PushService,
  SelectedTeamStore,
} from '@app/services';

@Component({
  selector: 'home-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pu-sidebar [teamId]="selectedTeamStore.storageSelectedTeamId()">
      <main class="px-2" hlmSidebarInset>
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
        @apply mx-auto;
      }
    }
  `,
  imports: [
    RouterOutlet,
    ReactiveFormsModule,
    BackendOfflineAlert,
    Sidebar,
    SiteHeader,
    HlmSidebarImports,
  ],
})
export class HomeLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly infoStore = inject(InfoStore);

  private readonly sidebarService = inject(HlmSidebarService);

  teamId = input(undefined, {
    transform: (it: string | undefined) => {
      if (it) {
        this.selectedTeamStore.storageSelectedTeamId.set(it);
      }
      return it;
    },
  });

  constructor() {
    this.infoStore.loadSupport();

    this.selectedTeamStore.loadSelectedTeam(this.selectedTeamStore.storageSelectedTeamId);

    inject(PushService).monitorStatusChange$.pipe(takeUntilDestroyed()).subscribe();

    const changelogStore = inject(ChangelogStore);

    changelogStore.showNewVersionDialog(
      computed(() => ({
        version: changelogStore.lastVersion(),
        newVersion: true,
      })),
    );

    const router = inject(Router);

    toObservable(this.sidebarService.isMobile).subscribe((isMobile) => {
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
