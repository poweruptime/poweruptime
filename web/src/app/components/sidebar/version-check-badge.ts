import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {RouterLink} from '@angular/router';

import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {InstanceSettingsStore, InstanceSettingsVersionCheckStore} from '@app/services';

@Component({
  template: `
    @if (versionCheckEnabled()) {
      @if (instanceSettingsVersionCheckStore.versionCheck(); as version) {
        <a routerLink="/settings/overview" fragment="version-check">
          <span class="bg-blue-500 text-white dark:bg-blue-600" hlmBadge variant="secondary">
            <ng-icon name="bootstrapArrowDownCircleFill" />
            <span class="hidden md:block">Update Available:</span>
            {{ version.version }} ({{ version.date.split('T')[0] | date: 'dd.MM.yyyy' }})
          </span>
        </a>
      }
    }
  `,
  selector: 'pu-version-check-badge',
  imports: [HlmIconImports, HlmBadgeImports, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionCheckBadge {
  protected instanceSettingsVersionCheckStore = inject(InstanceSettingsVersionCheckStore);
  protected instanceSettings = inject(InstanceSettingsStore).settings;

  protected versionCheckEnabled = computed(
    () => this.instanceSettings()?.versionCheckEnabled ?? false,
  );

  constructor() {
    this.instanceSettingsVersionCheckStore.makeVersionCheck(
      computed(() => ({versionCheckEnabled: this.versionCheckEnabled()})),
    );
  }
}
