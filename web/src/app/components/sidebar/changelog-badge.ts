import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {StopPropagationDirective} from 'dfx-helper';

import {ChangelogStore} from '@app/services';
import {environment} from '@app/util';

@Component({
  template: `
    <button
      class="flex items-center bg-blue-500 text-white hover:cursor-pointer dark:bg-blue-600"
      (click)="
        changelogStore.load(changelogStore.lastVersion()); setLastVersionStorageToCurrentVersion()
      "
      type="button"
      hlmBadge
      variant="secondary">
      <ng-icon name="bootstrapInfoCircleFill" />
      App updated to {{ version }}. New changelog available!

      <button
        class="ms-2 flex items-center hover:cursor-pointer"
        [attr.aria-label]="'general.copy' | transloco"
        (click)="setLastVersionStorageToCurrentVersion()"
        stopPropagation
        type="button">
        <ng-icon hlm name="bootstrapXCircleFill" size="sm" />
      </button>
    </button>
  `,
  selector: 'pu-changelog-badge',
  imports: [HlmIconImports, HlmBadgeImports, TranslocoPipe, StopPropagationDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogBadge {
  protected readonly changelogStore = inject(ChangelogStore);
  protected readonly version = environment.version;

  setLastVersionStorageToCurrentVersion() {
    this.changelogStore.lastVersion.set(this.version);
  }
}
