import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose} from '@spartan-ng/brain/dialog';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogImports} from '@spartan-ng/helm/dialog';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {InfoStore, InstanceSettingsStore} from '@app/services';
import {environment} from '@app/util';

import {CopyButton} from '../copy-button';

@Component({
  template: `
    <hlm-dialog autoFocus="dialog">
      <button
        class="hover:bg-accent h-11 w-full justify-start gap-3 text-base"
        hlmDialogTrigger
        type="button"
        hlmBtn
        variant="ghost">
        <ng-icon hlm name="bootstrapBug" size="sm" />
        Debug information
      </button>
      <hlm-dialog-content
        class="top-1/2 left-1/2 flex max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] w-full -translate-x-1/2 flex-col gap-0 overflow-hidden rounded-lg p-0 sm:max-h-[min(640px,80vh)] sm:w-lg"
        *hlmDialogPortal="let ctx"
        showCloseButton="false">
        <div class="flex-1 overflow-y-auto">
          @let _info = info();
          <hlm-dialog-header>
            <h2 class="mb-0 px-4 pt-6 text-lg font-semibold">Debug information</h2>
          </hlm-dialog-header>

          <div class="group relative p-4">
            <code
              class="bg-secondary/50 border-border/50 text-foreground flex items-start justify-between rounded-md border px-4 py-3 font-mono text-sm">
              <pre>{{ _info }}</pre>
            </code>
          </div>
        </div>
        <hlm-dialog-footer class="flex items-center gap-3 border-t px-6 py-4 sm:space-x-0">
          <pu-copy-button [content]="_info">
            {{ 'general.copy' | transloco }}
          </pu-copy-button>
          <button type="button" hlmBtn variant="outline" brnDialogClose>
            {{ 'general.close' | transloco }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </hlm-dialog>
  `,
  selector: 'pu-debug-info-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CopyButton,
    TranslocoPipe,
    HlmButtonImports,
    HlmDialogImports,
    HlmIconImports,
    BrnDialogClose,
  ],
})
export class DebugInfoDialog {
  private readonly infoStore = inject(InfoStore);
  private readonly instanceSettingsStore = inject(InstanceSettingsStore);

  private header(it: string): string {
    return `============ ${it} ============`;
  }

  info = computed(() => {
    const instanceSettings = this.instanceSettingsStore.settings();

    return `${this.header('INFO')}
Client-Time: ${new Date().toISOString()}
Client-Version: ${environment.version}
BA-Version: ${this.infoStore.version()}

BA-Time: ${this.infoStore.time()?.serverTime}
Start-Time: ${this.infoStore.time()?.serverStartTime}
Setup-Time: ${this.infoStore.time()?.serverSetupTime}
Enabled OAuth2 Providers: ${this.infoStore.oauth2Providers()?.reduce((acc, it) => acc + ` ${it.clientName}`, '') ?? 'None'}
Is-Setup: ${this.infoStore.isSetup()}
Is Supporter: ${this.infoStore.support()?.supportsSince != null}

${this.header('Instance settings')}
isUserAllowedToCreateTeams: ${instanceSettings?.isUserAllowedToCreateTeams}
Show supporter badge: ${this.infoStore.support()?.showSupportBadge}
Timezone: ${instanceSettings?.timezone}

Version check enabled: ${instanceSettings?.versionCheckEnabled}
Show new version dialog: ${instanceSettings?.showNewVersionDialog}
Version check admin mail: ${instanceSettings?.versionCheckAdminMailEnabled}

Check result retention in days: ${instanceSettings?.checkResultRetentionPeriodInDays}
Check result log retention in days: ${instanceSettings?.checkResultLogRetentionPeriodInDays}

${this.header('Environment')}
${JSON.stringify(this.infoStore.environment(), null, 2)}
`;
  });

  constructor() {
    this.infoStore.loadVersion();
    this.infoStore.loadOAuth2Providers();
    this.infoStore.loadIsSetup();
    this.infoStore.loadSupport();
    this.infoStore.loadTime();
    this.infoStore.loadEnvironment();

    this.instanceSettingsStore.load();
  }
}
