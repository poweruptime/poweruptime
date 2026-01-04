import {httpResource} from '@angular/common/http';
import {ChangeDetectionStrategy, Component, computed} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose} from '@spartan-ng/brain/dialog';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogImports} from '@spartan-ng/helm/dialog';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {environment} from '@app/util';

import {IsSystemAdmin} from '../directives';
import {BACKEND_API_URL} from '../util';
import {DebugInfoDialog} from './debug-info-dialog';
import {Dependency, LicenseDialog} from './license-dialog';

interface ImportedModule {
  moduleName: string;
  dependencies: Dependency[];
}

export interface LicenseData {
  dependencies: Dependency[];
  importedModules: ImportedModule[];
}

@Component({
  template: `
    <div class="flex-1 overflow-y-auto">
      <hlm-dialog-header>
        <h3 hlmDialogTitle>{{ 'general.help' | transloco }}</h3>
        <p hlmDialogDescription>Get support, view documentation, and system information</p>
      </hlm-dialog-header>

      <div class="space-y-1 py-2">
        <a
          class="hover:bg-accent h-11 w-full justify-start gap-3 text-base"
          href="https://github.com/poweruptime/poweruptime/discussions/categories/feature-requests-ideas"
          target="_blank"
          rel="noopener"
          hlmBtn
          variant="ghost">
          <ng-icon hlm name="lucideMessageCircle" size="sm" />
          Feedback
        </a>
        <a
          class="hover:bg-accent h-11 w-full justify-start gap-3 text-base"
          href="https://github.com/poweruptime/poweruptime/discussions"
          target="_blank"
          rel="noopener"
          hlmBtn
          variant="ghost">
          <ng-icon hlm name="lucideMessageSquare" size="sm" />
          Forum
        </a>
        <hr />
        <button
          class="hover:bg-accent h-11 w-full justify-start gap-3 text-base"
          type="button"
          hlmBtn
          variant="ghost">
          <ng-icon hlm name="bootstrapInfoCircleFill" size="sm" />
          <div class="flex items-center gap-2">
            <span>Version</span>
            <span class="bg-secondary rounded px-2 py-0.5 font-mono text-xs">{{ version }}</span>
          </div>
        </button>
        <pu-debug-info-dialog *isSystemAdmin />
      </div>

      <h2 class="text-xl font-bold">Licenses ❤</h2>

      <div class="space-y-1 py-2">
        <pu-license-dialog [licenses]="feLicenses()" btnText="Web" />
        @if (licenses.value()?.dependencies; as beDependencies) {
          <pu-license-dialog [licenses]="beDependencies" btnText="Backend" />
        }
      </div>
    </div>
    <hlm-dialog-footer>
      <button type="button" hlmBtn variant="outline" brnDialogClose>
        {{ 'general.close' | transloco }}
      </button>
    </hlm-dialog-footer>
  `,
  selector: 'pu-help-dialog',
  host: {
    class:
      'max-h-[calc(100vh-2rem)] w-full max-w-[calc(100%-2rem)] sm:max-h-[min(640px,80vh)] sm:max-w-lg overflow-hidden',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoPipe,
    IsSystemAdmin,
    HlmDialogImports,
    HlmButtonImports,
    HlmIconImports,
    BrnDialogClose,
    LicenseDialog,
    DebugInfoDialog,
  ],
})
export class HelpDialog {
  version = environment.version;

  licenses = httpResource<LicenseData>(
    () => `${BACKEND_API_URL}/v1/public/static-files/licenses.json`,
  );

  feLicenses = computed(() => this.licenses.value()?.importedModules?.[0]?.dependencies ?? []);
}
