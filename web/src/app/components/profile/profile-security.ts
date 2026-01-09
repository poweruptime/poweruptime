import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';

import {ProfileEditStore} from '@app/services';

import {ProfileMFAForm} from './profile-mfa-form';
import {ProfilePasswordEditForm} from './profile-password-edit-form';
import {ProfileSessionTable} from './profile-session-table';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <section class="w-full" hlmCard>
            <div hlmCardHeader>
              <h3 hlmCardTitle>{{ 'profile.password.update' | transloco }}</h3>
            </div>

            <div hlmCardContent>
              <pu-profile-password-form (submitCreate)="profileEditStore.updatePassword($event)" />
            </div>
          </section>
        </div>
        <div>
          <section class="w-full" hlmCard>
            <div hlmCardHeader>
              <h3 hlmCardTitle>{{ 'profile.mfa.title' | transloco }}</h3>
            </div>

            <div hlmCardContent>
              <pu-profile-mfa-form />
            </div>
          </section>
        </div>
      </div>

      <pu-profile-session-table />
    </div>
  `,
  selector: 'pu-profile-security',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileEditStore],
  imports: [
    TranslocoPipe,
    ProfilePasswordEditForm,
    ProfileMFAForm,
    ProfileSessionTable,
    HlmCardImports,
  ],
})
export class ProfileSecurity {
  protected readonly profileEditStore = inject(ProfileEditStore);
}
