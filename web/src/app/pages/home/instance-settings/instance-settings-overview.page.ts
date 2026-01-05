import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {BackendType} from '@app/api';
import {
  InstanceSettingsGeneralForm,
  InstanceSettingsPermissionsForm,
  InstanceSettingsRetentionForm,
  InstanceSettingsSponsorshipForm,
  InstanceSettingsVersionCheckForm,
} from '@app/components/instance-settings';
import {
  InstanceAvailableTimezonesStore,
  InstanceSettingsStore,
  InstanceSettingsSupportStore,
  InstanceSettingsVersionCheckStore,
} from '@app/services';

@Component({
  template: `
    @if (instanceSettingsStore.settings(); as settings) {
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-foreground text-3xl font-bold tracking-tight">Settings</h1>
          <p class="text-muted-foreground mt-2">
            Manage your application preferences and configuration
          </p>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <pu-instance-settings-general-form
            [availableTimezones]="instanceAvailableTimezonesStore.availableTimezones()"
            [settings]="settings"
            (submitCreate)="submitGeneralForm($event)" />

          <pu-instance-settings-version-check-form
            [isLoading]="instanceSettingsVersionCheckStore.isPending()"
            [settings]="settings"
            (submitSettings)="submitVersionCheck($event)" />

          <pu-instance-settings-permissions-form
            [settings]="settings"
            (submitCreate)="submitPermissionsForm($event)" />

          <pu-instance-settings-retention-form
            [settings]="settings"
            (submitCreate)="submitRetentionForm($event)" />

          <pu-instance-settings-sponsorship-form
            [isLoading]="instanceSettingsSupportStore.isPending()"
            [settings]="settings"
            (submitCreate)="submitSponsorshipForm($event)" />
        </div>
      </div>
    }
  `,
  selector: 'pu-instance-settings-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InstanceSettingsGeneralForm,
    InstanceSettingsRetentionForm,
    InstanceSettingsPermissionsForm,
    InstanceSettingsSponsorshipForm,
    InstanceSettingsVersionCheckForm,
  ],
})
export class InstanceSettingsOverviewPage {
  readonly instanceSettingsStore = inject(InstanceSettingsStore);
  readonly instanceSettingsSupportStore = inject(InstanceSettingsSupportStore);
  readonly instanceSettingsVersionCheckStore = inject(InstanceSettingsVersionCheckStore);
  readonly instanceAvailableTimezonesStore = inject(InstanceAvailableTimezonesStore);

  constructor() {
    this.instanceAvailableTimezonesStore.load();
  }

  submitGeneralForm(it: BackendType['InstanceSettingsResponse']) {
    this.instanceSettingsStore.setTimezone(it.timezone);
    this.instanceSettingsStore.setShowNewVersionDialog(it.showNewVersionDialog);
  }

  submitPermissionsForm(it: BackendType['InstanceSettingsResponse']) {
    this.instanceSettingsStore.setIsUserAllowedToCreateTeams(it.isUserAllowedToCreateTeams);
  }

  submitRetentionForm(it: BackendType['SettingRetentionDto']) {
    this.instanceSettingsStore.setRetention(it);
  }

  submitSponsorshipForm(it: BackendType['InstanceSettingSupportDto']) {
    this.instanceSettingsSupportStore.setSupport(it);
  }

  submitVersionCheck(it: BackendType['InstanceSettingVersionCheckDto']) {
    this.instanceSettingsVersionCheckStore.setVersionCheck(it);
  }
}
