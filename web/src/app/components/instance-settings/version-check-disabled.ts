import {ChangeDetectionStrategy, Component, output} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';

@Component({
  template: `
    <div class="absolute inset-0 z-10 bg-transparent"></div>
    <div class="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-20">
      <div>
        <strong>{{ 'instanceSettings.versionCheck.warning.1' | transloco }}</strong>
        <div class="mt-4">
          <i>{{ 'instanceSettings.versionCheck.warning.2' | transloco }}</i>
        </div>
        <ul class="list-disc">
          <li>{{ 'instanceSettings.versionCheck.warning.3' | transloco }}</li>
          <li>{{ 'instanceSettings.versionCheck.warning.4' | transloco }}</li>
        </ul>
      </div>
      <button (click)="enableVersionCheck.emit()" type="button" hlmBtn variant="outline">
        {{ 'general.enable' | transloco }}
      </button>
    </div>
  `,
  selector: 'pu-version-check-disabled',
  imports: [TranslocoPipe, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionCheckDisabled {
  enableVersionCheck = output<void>();
}
