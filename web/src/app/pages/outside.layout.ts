import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {BackendOfflineAlert, OutsideBottomActions} from '@app/components';
import {BackendOfflineService} from '@app/services';

@Component({
  selector: 'outside-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 pt-4 sm:container sm:mx-auto" style="max-width: 70rem">
      @defer (when backendOfflineService.isOffline()) {
        @if (backendOfflineService.isOffline()) {
          <pu-backend-offline-alert />
        }
      }
      <main>
        <router-outlet />
      </main>
    </div>

    <pu-outside-bottom-actions />
  `,
  imports: [RouterOutlet, BackendOfflineAlert, OutsideBottomActions],
})
export class OutsideLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
}
