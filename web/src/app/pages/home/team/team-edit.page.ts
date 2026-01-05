import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

import {BackendType} from '@app/api';
import {InstanceSettingsRetentionForm} from '@app/components/instance-settings';
import {TeamEditForm, TeamInvitesList, TeamSettings, TeamUsersList} from '@app/components/team';
import {InstanceAvailableTimezonesStore, TeamEditStore, TeamSettingsStore} from '@app/services';

@Component({
  template: `
    @let team = teamEditStore.team();

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      @if (teamId(); as teamId) {
        @if (team; as team) {
          <div class="mb-8">
            <h1 class="text-foreground text-3xl font-bold tracking-tight">
              <span class="font-mono uppercase">{{ team.name }}</span>
              {{ 'team.edit.edit' | transloco }}
            </h1>
            <p class="text-muted-foreground mt-2">
              {{ 'team.edit.description' | transloco }}
            </p>
          </div>

          <div class="grid gap-6 lg:grid-cols-2">
            <div class="h-full flex-col justify-between" hlmCard>
              <div class="flex flex-col gap-6">
                <div hlmCardHeader>
                  <div class="flex items-center gap-2">
                    <ng-icon name="bootstrapGlobe" helm />
                    <h3 hlmCardTitle>{{ 'general.general' | transloco }}</h3>
                  </div>
                </div>
                <div hlmCardContent>
                  <pu-team-edit-form [team]="team" (submitUpdate)="teamEditStore.update($event)" />
                </div>
              </div>
            </div>

            <div class="h-full flex-col justify-between" hlmCard>
              <div class="flex flex-col gap-6">
                <div hlmCardHeader>
                  <div class="flex items-center gap-2">
                    <ng-icon name="bootstrapGlobe" helm />
                    <h3 hlmCardTitle>{{ 'general.settings' | transloco }}</h3>
                  </div>
                  <p hlmCardDescription>Configure your basic team settings</p>
                </div>
                <div hlmCardContent>
                  @if (teamSettingsStore.settings(); as settings) {
                    <pu-team-settings
                      [availableTimezones]="instanceAvailableTimezonesStore.availableTimezones()"
                      [settings]="settings"
                      (submitCreate)="teamSettingsStore.setTimezone($event.timezone)" />
                  }
                </div>
              </div>
            </div>

            @if (teamSettingsStore.settings(); as settings) {
              <pu-instance-settings-retention-form
                [settings]="settings"
                (submitCreate)="submitRetentionForm($event)" />
            }

            @defer (when !team.personal) {
              @if (!team.personal) {
                <mat-card class="col-span-2" appearance="outlined">
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

                <mat-card class="col-span-2" appearance="outlined">
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
          <div class="mb-8">
            <hlm-skeleton class="h-12 w-96" />
            <hlm-skeleton class="mt-2 h-8 w-64" />
          </div>
          <div class="grid gap-6 lg:grid-cols-2">
            <hlm-skeleton class="h-48 w-full" />
            <hlm-skeleton class="h-48 w-full" />
            <hlm-skeleton class="h-48 w-full" />
          </div>
        }
      } @else {
        <div class="flex flex-col gap-4">
          <h1 class="text-4xl"></h1>
          <div class="mb-8">
            <h1 class="text-foreground text-3xl font-bold tracking-tight">
              {{ 'team.create.create' | transloco }}
            </h1>
            <p class="text-muted-foreground mt-2">
              {{ 'team.create.description' | transloco }}
            </p>
          </div>

          <div class="flex">
            <pu-team-edit-form [team]="undefined" (submitCreate)="teamEditStore.create($event)" />
          </div>
          <div></div>
        </div>
      }
    </div>
  `,
  selector: 'pu-team-edit-page',
  imports: [
    TeamEditForm,
    TeamSettings,
    TeamUsersList,
    RouterLink,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TeamInvitesList,
    TranslocoPipe,
    MatButton,
    InstanceSettingsRetentionForm,
    ReactiveFormsModule,
    HlmSkeletonImports,
    HlmCardImports,
    HlmIconImports,
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

  submitRetentionForm(it: BackendType['SettingRetentionDto']) {
    this.teamSettingsStore.setRetention(it);
  }
}
