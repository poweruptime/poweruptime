import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MatAnchor} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';

import {Placeholder} from '@app/components';
import {TeamEditForm, TeamInvitesList, TeamSettings, TeamUsersList} from '@app/components/team';
import {InstanceAvailableTimezonesStore, TeamEditStore, TeamSettingsStore} from '@app/services';

@Component({
  template: `
    @let team = teamEditStore.team();

    @if (teamId(); as teamId) {
      @if (team; as team) {
        <h2 class="mb-4 text-3xl">{{ 'team.edit.edit' | transloco: team }}</h2>

        <div class="mt-4 grid gap-4 md:grid-cols-6">
          <mat-card class="col-span-2" appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ 'general.general' | transloco }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="h-4"></div>
              <pu-team-edit-form [team]="team" (submitUpdate)="teamEditStore.update($event)" />
            </mat-card-content>
          </mat-card>

          <mat-card class="col-span-2" appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ 'general.settings' | transloco }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              @if (teamSettingsStore.settings(); as settings) {
                <div class="h-4"></div>
                <pu-team-settings
                  [availableTimezones]="instanceAvailableTimezonesStore.availableTimezones()"
                  [settings]="settings"
                  (submitCreate)="teamSettingsStore.setTimezone($event.timezone)" />
              }
            </mat-card-content>
          </mat-card>

          @defer (when !team.personal) {
            @if (!team.personal) {
              <mat-card class="col-span-4" appearance="outlined">
                <mat-card-header>
                  <mat-card-title>{{ 'general.users' | transloco }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="h-4"></div>
                  <div class="flex flex-col gap-2">
                    <div>
                      <a mat-flat-button routerLink="../invite">
                        {{ 'general.invite' | transloco }}
                      </a>
                    </div>

                    <pu-team-users-list [teamId]="teamId" />
                  </div>
                </mat-card-content>
              </mat-card>

              <mat-card class="col-span-4" appearance="outlined">
                <mat-card-header>
                  <mat-card-title>{{ 'team.edit.openInvites' | transloco }}</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="h-4"></div>
                  <pu-team-invites-list [teamId]="teamId" />
                </mat-card-content>
              </mat-card>
            }
          }
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
  readonly teamEditStore = inject(TeamEditStore);
  readonly teamSettingsStore = inject(TeamSettingsStore);
  readonly instanceAvailableTimezonesStore = inject(InstanceAvailableTimezonesStore);

  readonly teamId = input<string>();

  constructor() {
    this.instanceAvailableTimezonesStore.load();
    this.teamEditStore.loadById(this.teamId);
    this.teamSettingsStore.load(this.teamId);
  }
}
