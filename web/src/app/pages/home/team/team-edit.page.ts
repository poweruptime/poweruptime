import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';

import {Placeholder} from '@app/components';
import {TeamEditForm, TeamSettings, TeamUsersList} from '@app/components/team';
import {TeamInvitesList} from '@app/components/team/team-invites-list';
import {
  InstanceAvailableTimezonesStore,
  SelectedTeamStore,
  TeamEditStore,
  TeamSettingsStore,
} from '@app/services';

@Component({
  template: `
    @let teamId = selectedTeamStore.selectedTeamId();
    @let team = teamEditStore.team();

    @if (teamId) {
      @if (team; as team) {
        <h2 class="mb-4 text-3xl">{{ 'team.edit.edit' | transloco: team }}</h2>

        <div class="grid md:grid-cols-6">
          <div class="col-span-3 flex w-full flex-col gap-4 xl:col-span-2">
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ 'general.general' | transloco }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="pt-4">
                  <pu-team-edit-form [team]="team" (submitUpdate)="teamEditStore.update($event)" />
                </div>
              </mat-card-content>
            </mat-card>

            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ 'general.settings' | transloco }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="pt-4">
                  @let settings = teamSettingsStore.settings();
                  <pu-team-settings
                    [availableTimezones]="instanceAvailableTimezonesStore.availableTimezones()"
                    [selectedTimezone]="settings?.timezone"
                    (timezoneChange)="teamSettingsStore.setTimezone($event)" />
                </div>
              </mat-card-content>
            </mat-card>

            @defer (when !team.personal) {
              @if (!team.personal) {
                <mat-card appearance="outlined">
                  <mat-card-header>
                    <mat-card-title>{{ 'general.users' | transloco }}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="flex flex-col gap-2 pt-4">
                      <div>
                        <a mat-flat-button routerLink="../invite">
                          {{ 'general.invite' | transloco }}
                        </a>
                      </div>

                      <pu-team-users-list [teamId]="teamId" />
                    </div>
                  </mat-card-content>
                </mat-card>

                <mat-card appearance="outlined">
                  <mat-card-header>
                    <mat-card-title>{{ 'team.edit.openInvites' | transloco }}</mat-card-title>
                  </mat-card-header>
                  <mat-card-content>
                    <div class="pt-4">
                      <pu-team-invites-list [teamId]="teamId" />
                    </div>
                  </mat-card-content>
                </mat-card>
              }
            }
          </div>
        </div>
      } @else {
        <pu-placeholder class="h-12 w-64" />

        <pu-placeholder class="h-12 w-64" />
      }
    } @else {
      <div class="flex flex-col gap-4">
        <h1 class="text-4xl">{{ 'cmdk.groups.team.create' | transloco }}</h1>

        <div class="flex">
          <pu-team-edit-form [team]="undefined" (submitCreate)="teamEditStore.create($event)" />
        </div>
        <div></div>
      </div>
    }
  `,
  selector: 'pu-team-edit-page',
  imports: [
    TeamEditForm,
    TeamSettings,
    TeamUsersList,
    RouterLink,
    MatAnchor,
    Placeholder,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TeamInvitesList,
    TranslocoPipe,
  ],
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
