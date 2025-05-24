import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {BackendType} from '@app/api';
import {
  InstanceSettingsGeneralForm,
  InstanceSettingsPermissionsForm,
  InstanceSettingsRetentionForm,
  InstanceSettingsSponsorshipForm,
} from '@app/components/instance-settings';
import {
  InstanceAvailableTimezonesStore,
  InstanceSettingsStore,
  SelectedTeamStore,
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

          <pu-instance-settings-permissions-form
            [settings]="settings"
            (submitCreate)="submitPermissionsForm($event)" />

          <pu-instance-settings-retention-form
            [settings]="settings"
            (submitCreate)="submitRetentionForm($event)" />
        </div>
        <div class="col-span-1 flex w-full flex-col gap-4 md:col-span-3 xl:col-span-2">
          <pu-instance-settings-sponsorship-form
            [isLoading]="instanceSettingsStore.isPending()"
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
  ],
})
export class InstanceSettingsOverviewPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly instanceSettingsStore = inject(InstanceSettingsStore);
  readonly instanceAvailableTimezonesStore = inject(InstanceAvailableTimezonesStore);

  constructor() {
    this.instanceAvailableTimezonesStore.load();
    this.instanceSettingsStore.load(this.selectedTeamStore.selectedTeamId);
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
    this.instanceSettingsStore.setSupport(it);
  }
}
