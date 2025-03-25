import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

import {BackendOfflineAlert, OutsideLanguageSwitch, OutsideThemeSwitch} from '@app/components';
import {BackendOfflineService} from '@app/services';

@Component({
  selector: 'outside-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 pt-4 md:container md:mx-auto">
      @defer (when backendOfflineService.isOffline()) {
        @if (backendOfflineService.isOffline()) {
          <pu-backend-offline-alert />
        }
      }
      <main>
        <router-outlet />
      </main>
    </div>

    <pu-outside-language-switch />
    <pu-outside-theme-switch />
  `,
  imports: [RouterOutlet, BackendOfflineAlert, OutsideThemeSwitch, OutsideLanguageSwitch],
})
export class OutsideLayout {
  readonly backendOfflineService = inject(BackendOfflineService);
}
