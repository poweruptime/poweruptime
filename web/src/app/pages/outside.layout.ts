import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {RouterOutlet} from '@angular/router';

import {timer} from 'rxjs';

import {injectWindow} from 'dfx-helper';
import {createInjectable} from 'ngxtension/create-injectable';

import {OutsideThemeSwitch} from '../components';

@Component({
  selector: 'backend-offline-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-gray-800 dark:text-red-400"
      role="alert">
      <span class="font-bold">Error!</span>
      It seems like the backend is offline. Try in a few minutes again.
    </div>
  `,
})
class BackendOfflineAlert {
  private window = injectWindow();
  constructor() {
    timer(10 * 1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.window?.location?.reload();
      });
  }
}

@Component({
  selector: 'outside-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="px-4 pt-4 md:container md:mx-auto">
      @defer (when backendOfflineService.isOffline()) {
        @if (backendOfflineService.isOffline()) {
          <backend-offline-alert />
        }
      }
      <main class="main">
        <router-outlet />
      </main>
    </div>

    <pu-outside-theme-switch />
  `,
  imports: [RouterOutlet, BackendOfflineAlert, OutsideThemeSwitch],
})
export class OutsideLayout {
  backendOfflineService = inject(BackendOfflineService);
}

export const BackendOfflineService = createInjectable(
  () => {
    const isOffline = signal(false);
    return {
      isOffline: isOffline,
      set: (it: boolean): void => isOffline.set(it),
    };
  },
  {providedIn: 'root'},
);
