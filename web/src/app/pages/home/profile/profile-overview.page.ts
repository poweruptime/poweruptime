import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

import {ProfileEmailEditForm} from '@app/components/profile';
import {ProfileEditStore, ProfileStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      <div class="grid grid-cols-3">
        <div>
          <mat-card appearance="outlined">
            <mat-card-content>
              @if (profileStore.email(); as email) {
                <pu-profile-email-form
                  [email]="email"
                  (submitCreate)="profileEditStore.requestEmailChange($event)" />
              }
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  selector: 'pu-profile-overview-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileEditStore],
  imports: [MatCard, MatCardContent, ProfileEmailEditForm],
})
export class ProfileOverviewPage {
  readonly profileStore = inject(ProfileStore);
  readonly profileEditStore = inject(ProfileEditStore);

  constructor() {
    this.profileStore.loadProfile();
  }
}
