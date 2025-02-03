import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {RouterLink} from '@angular/router';

import {Placeholder} from '@app/components';
import {TeamEditForm, TeamSettings, TeamUsersList} from '@app/components/team';
import {
  InstanceAvailableTimezonesStore,
  SelectedTeamStore,
  TeamEditStore,
  TeamSettingsStore,
} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-16">
      @let teamId = selectedTeamStore.selectedTeamId();
      @let team = teamEditStore.team();

      <div class="flex flex-col gap-4">
        @if (teamId) {
          @if (team; as team) {
            <h1 class="text-4xl">Edit {{ team.name }}</h1>
          } @else {
            <pu-placeholder class="h-12 w-64" />
          }
        } @else {
          <h1 class="text-4xl">Create new team</h1>
        }

        <div class="flex">
          @if (!teamId || team) {
            <pu-team-edit-form
              [team]="team"
              (submitCreate)="teamEditStore.create($event)"
              (submitUpdate)="teamEditStore.update($event)" />
          } @else {
            <pu-placeholder class="h-12 w-64" />
          }

          <div></div>
        </div>
      </div>

      @if (teamId) {
        <div class="flex flex-col gap-4">
          <h2 class="text-3xl">Settings</h2>

          @let settings = teamSettingsStore.settings();
          <pu-team-settings
            [availableTimezones]="instanceAvailableTimezonesStore.availableTimezones()"
            [selectedTimezone]="settings?.timezone"
            (timezoneChange)="teamSettingsStore.setTimezone($event)" />
        </div>

        <div class="flex flex-col gap-4">
          <div class="flex justify-between">
            <h2 class="text-3xl">Users</h2>

            <a class="secondary-button" mat-flat-button routerLink="../invite">Invite</a>
          </div>
          <pu-team-users-list [teamId]="teamId" />
        </div>
      }
    </div>
  `,
  selector: 'pu-team-edit-page',
  imports: [TeamEditForm, TeamSettings, TeamUsersList, RouterLink, MatAnchor, Placeholder],
  providers: [TeamEditStore, TeamSettingsStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly teamEditStore = inject(TeamEditStore);
  readonly teamSettingsStore = inject(TeamSettingsStore);
  readonly instanceAvailableTimezonesStore = inject(InstanceAvailableTimezonesStore);

  constructor() {
    this.instanceAvailableTimezonesStore.load();
    this.teamEditStore.loadById(this.selectedTeamStore.selectedTeamId);
    this.teamSettingsStore.load(this.selectedTeamStore.selectedTeamId);
  }
}
