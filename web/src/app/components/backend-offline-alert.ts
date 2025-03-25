import {ChangeDetectionStrategy, Component} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {injectWindow} from 'dfx-helper';

import {AlertDirective} from './alert.directive';

@Component({
  selector: 'backend-offline-alert',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div puAlert type="WARN">
      <span class="font-bold">{{ 'backendOffline.title' | transloco }}!</span>
      {{ 'backendOffline.description' | transloco }}!
    </div>
  `,
  imports: [AlertDirective, TranslocoPipe],
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
