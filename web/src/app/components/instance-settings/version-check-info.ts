import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {InfoStore, InstanceSettingsVersionCheckStore} from '@app/services';

import {CopyIconButton} from '../copy-icon-button';

@Component({
  template: `
    @let currentVersion = infoStore.version();

    @if (instanceSettingsVersionCheckStore.versionCheck()?.version; as latestVersion) {
      <section class="gap-3" hlmCard>
        <div class="flex items-center gap-2" hlmCardHeader>
          <div class="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
          <h4 class="text-sm font-medium" hlmCardTitle>New version available</h4>
        </div>
        <div class="space-y-4" hlmCardContent>
          <div class="flex items-center gap-3">
            <span class="font-mono" hlmBadge variant="outline">
              {{ currentVersion }}
            </span>
            <ng-icon hlm name="bootstrapArrowRight" size="sm" />
            <span
              class="bg-blue-500 font-mono text-white dark:bg-blue-600"
              variant="secondary"
              hlmBadge>
              {{ latestVersion }}
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button
              (click)="
                instanceSettingsVersionCheckStore.makeVersionCheck({
                  versionCheckEnabled: true,
                  skipCache: true,
                })
              "
              hlmBtn
              variant="outline"
              type="button">
              <ng-icon hlm size="sm" name="bootstrapArrowClockwise" />
              Check for Updates
            </button>

            @let link =
              latestVersion.includes('beta')
                ? 'https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG-beta.md'
                : 'https://github.com/poweruptime/poweruptime/blob/main/changelogs/CHANGELOG.md';
            <a [href]="link" hlmBtn variant="outline" target="_blank" rel="noopener">
              View on GitHub
              <ng-icon hlm size="sm" name="bootstrapBoxArrowUpRight" />
            </a>
          </div>
        </div>
      </section>

      <div class="space-y-2">
        <span class="text-muted-foreground text-xs tracking-wide uppercase">
          Update via terminal
        </span>
        <div class="group relative">
          <div
            class="bg-secondary/50 border-border/50 flex items-center justify-between rounded-md border px-4 py-3 font-mono text-sm">
            <code class="text-foreground">./pu update</code>
            <pu-copy-icon-button [content]="'./pu update'" />
          </div>
        </div>
      </div>
    } @else {
      <div class="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-500">
        <ng-icon hlm name="bootstrapCheck2Circle" />
        <span class="font-medium">You're running the latest version</span>
      </div>

      <div>
        <button
          (click)="
            instanceSettingsVersionCheckStore.makeVersionCheck({
              versionCheckEnabled: true,
              skipCache: true,
            })
          "
          hlmBtn
          variant="outline"
          type="button">
          <ng-icon hlm size="sm" name="bootstrapArrowClockwise" />
          Check for Updates
        </button>
      </div>
    }
  `,
  host: {
    class: 'flex flex-col gap-4',
  },
  selector: 'pu-version-check-info',
  imports: [CopyIconButton, HlmCardImports, HlmIconImports, HlmBadgeImports, HlmButtonImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionCheckInfo {
  protected readonly infoStore = inject(InfoStore);
  protected readonly instanceSettingsVersionCheckStore = inject(InstanceSettingsVersionCheckStore);
}
