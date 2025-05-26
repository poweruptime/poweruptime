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
      <div class="grid gap-4 md:grid-cols-6">
        <div class="col-span-1 flex w-full flex-col gap-4 md:col-span-3 xl:col-span-2">
          <pu-instance-settings-general-form
            [availableTimezones]="instanceAvailableTimezonesStore.availableTimezones()"
            [settings]="settings"
            (submitCreate)="submitGeneralForm($event)" />

          <pu-instance-settings-version-check-form
            [isLoading]="instanceSettingsVersionCheckStore.isPending()"
            [settings]="settings"
            (onSubmit)="submitVersionCheck($event)" />

          <pu-instance-settings-retention-form
            [settings]="settings"
            (submitCreate)="submitRetentionForm($event)" />
        </div>
        <div class="col-span-1 flex w-full flex-col gap-4 md:col-span-3 xl:col-span-2">
          <pu-instance-settings-permissions-form
            [settings]="settings"
            (submitCreate)="submitPermissionsForm($event)" />
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
  }

  submitPermissionsForm(it: BackendType['InstanceSettingsResponse']) {
    this.instanceSettingsStore.setIsUserAllowedToCreateTeams(it.isUserAllowedToCreateTeams);
  }

  submitRetentionForm(it: BackendType['InstanceSettingRetentionDto']) {
    this.instanceSettingsStore.setRetention(it);
  }

  submitSponsorshipForm(it: BackendType['InstanceSettingSupportDto']) {
    this.instanceSettingsSupportStore.setSupport(it);
  }

  submitVersionCheck(it: BackendType['InstanceSettingVersionCheckDto']) {
    this.instanceSettingsVersionCheckStore.setVersionCheck(it);
  }
}
