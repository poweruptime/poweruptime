import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {HlmCardImports} from '@spartan-ng/helm/card';

import {ProfileEditStore, ProfileStore} from '@app/services';

import {ProfileEmailEditForm} from './profile-email-edit-form';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <div class="grid md:grid-cols-2 xl:grid-cols-3">
        <div>
          <section class="h-full w-full" hlmCard>
            <div hlmCardContent>
              @if (profileStore.email(); as email) {
                <pu-profile-email-form
                  [email]="email"
                  (submitCreate)="profileEditStore.requestEmailChange($event)" />
              }
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  selector: 'pu-profile-general-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileEditStore],
  imports: [ProfileEmailEditForm, HlmCardImports],
})
export class ProfileGeneralCard {
  protected readonly profileStore = inject(ProfileStore);
  protected readonly profileEditStore = inject(ProfileEditStore);

  constructor() {
    this.profileStore.loadProfile();
  }
}
