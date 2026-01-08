import {ChangeDetectionStrategy, Component} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {ProfileGeneralCard, ProfileSecurity} from '@app/components/profile';

@Component({
  template: `
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-foreground text-3xl font-bold tracking-tight">
          {{ 'profile.settings' | transloco }}
        </h1>
        <p class="text-muted-foreground mt-2">Manage your profile and security preferences</p>
      </div>

      <div class="flex flex-col gap-14">
        <div class="flex flex-col gap-4">
          <h2 class="text-2xl font-bold tracking-tight">{{ 'general.overview' | transloco }}</h2>
          <pu-profile-general-card />
        </div>

        <hr />

        <div class="flex flex-col gap-4">
          <h2 class="text-2xl font-bold tracking-tight">{{ 'general.security' | transloco }}</h2>
          <pu-profile-security />
        </div>
      </div>
    </div>
  `,
  selector: 'profile-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, ProfileGeneralCard, ProfileSecurity, ProfileGeneralCard],
})
export class ProfilePage {}
