import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';

import {TranslocoPipe} from '@jsverse/transloco';

import {
  ProfileMFAForm,
  ProfilePasswordEditForm,
  ProfileSessionTable,
} from '@app/components/profile';
import {ProfileEditStore, SessionsStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-10">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ 'profile.password.update' | transloco }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="mt-4">
                <pu-profile-password-form
                  (submitCreate)="profileEditStore.updatePassword($event)" />
              </div>
            </mat-card-content>
          </mat-card>
        </div>
        <div>
          <mat-card appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ 'profile.mfa.title' | transloco }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="mt-4">
                <pu-profile-mfa-form />
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <pu-profile-session-table class="md:col-span-2" />
      </div>
    </div>
  `,
  selector: 'pu-profile-security-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileEditStore],
  imports: [
    MatCard,
    MatCardContent,
    ProfilePasswordEditForm,
    MatCardHeader,
    MatCardTitle,
    TranslocoPipe,
    ProfileMFAForm,
    ProfileSessionTable,
  ],
})
export class ProfileSecurityPage {
  readonly profileEditStore = inject(ProfileEditStore);
}
