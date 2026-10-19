import {ChangeDetectionStrategy, Component} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {injectWindow} from 'dfx-helper';

@Component({
  selector: 'pu-backend-offline-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mb-4" hlmAlert variant="destructive">
      <ng-icon class="text-[length:--spacing(6)]" hlmAlertIcon name="lucideCircleAlert" />
      <h4 hlmAlertTitle>{{ 'backendOffline.title' | transloco }}</h4>
      <p hlmAlertDescription>{{ 'backendOffline.description' | transloco }}</p>
    </div>
  `,
  imports: [TranslocoPipe, HlmAlertImports, NgIcon],
})
export class BackendOfflineAlert {
  private window = injectWindow();

  constructor() {
    console.warn('Reloading page in 30 seconds because the backend offline is offline.');
    timer(30 * 1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.window?.location?.reload();
      });
  }
}
