import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

import {BackendType} from '@app/api';
import {InstanceSettingsRetentionForm} from '@app/components/instance-settings';
import {TeamEditForm, TeamInviteList, TeamSettings, TeamUserTable} from '@app/components/team';
import {InstanceAvailableTimezonesStore, TeamEditStore, TeamSettingsStore} from '@app/services';

@Component({
  template: `
    @let team = teamEditStore.team();

    <div class="mx-auto max-w-7xl pb-8 sm:px-6 lg:px-8">
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

          <div class="flex flex-col gap-6">
            <div class="grid gap-6 lg:grid-cols-2">
              <section class="flex h-full flex-col gap-6" hlmCard>
                <div hlmCardHeader>
                  <div class="flex items-center gap-2">
                    <ng-icon name="bootstrapGlobe" helm />
                    <h3 hlmCardTitle>{{ 'general.general' | transloco }}</h3>
                  </div>
                </div>
                <div hlmCardContent>
                  <pu-team-edit-form [team]="team" (submitUpdate)="teamEditStore.update($event)" />
                </div>
              </section>

              <section class="flex h-full flex-col gap-6" hlmCard>
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
              </section>

              @if (teamSettingsStore.settings(); as settings) {
                <pu-instance-settings-retention-form
                  [settings]="settings"
                  (submitCreate)="submitRetentionForm($event)" />
              }
            </div>

            @defer (when !team.personal) {
              @if (!team.personal) {
                <pu-team-user-table [teamId]="teamId" />

                <pu-team-invite-list [teamId]="teamId" />
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
    TeamUserTable,
    TranslocoPipe,
    InstanceSettingsRetentionForm,
    ReactiveFormsModule,
    HlmSkeletonImports,
    HlmCardImports,
    HlmIconImports,
    TeamInviteList,
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
