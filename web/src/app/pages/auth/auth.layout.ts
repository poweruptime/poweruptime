import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {BackendOfflineAlert, DotBackground, OutsideBottomActions} from '@app/components';
import {BackendOfflineService} from '@app/services';

@Component({
  selector: 'auth-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <pu-dot-background />

    <div class="relative flex h-screen flex-col items-center justify-center px-4 pt-4">
      <main class="w-full max-w-[30rem]">
        @defer (when backendOfflineService.isOffline()) {
          @if (backendOfflineService.isOffline()) {
            <pu-backend-offline-alert />
          }
        }

        <router-outlet />
      </main>
    </div>

    <pu-outside-bottom-actions />
  `,
  imports: [RouterOutlet, BackendOfflineAlert, OutsideBottomActions, DotBackground],
})
export class AuthLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
}
