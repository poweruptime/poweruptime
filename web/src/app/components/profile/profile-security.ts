import {ChangeDetectionStrategy, Component, inject} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';

import {MFAEditStore, ProfileEditStore} from '@app/services';

import {MFABackupCodesCard} from './mfa/mfa-backup-codes-card';
import {MFAConfirmCard} from './mfa/mfa-confirm-card';
import {MFADisabledCard} from './mfa/mfa-disabled-card';
import {MFAEnabledCard} from './mfa/mfa-enabled-card';
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
          @let mfaState = mfaEditStore.state();

          @switch (mfaState) {
            @case ('DISABLED') {
              <pu-mfa-disabled-card (enableMFA)="mfaEditStore.setup()" />
            }
            @case ('CONFIRM') {
              <pu-mfa-confirm-card />
            }
            @case ('ENABLED') {
              <!-- ['123456', '123456', '123456', '123456', '123456', '123456', '123456', '123456', '123456'] -->
              @if (mfaEditStore.backupCodes(); as backupCodes) {
                <pu-mfa-backup-codes-card
                  [backupCodes]="backupCodes"
                  (doneManagingBackupCodes)="mfaEditStore.setDone()" />
              } @else {
                <pu-mfa-enabled-card (disableMFA)="mfaEditStore.delete()" />
              }
            }
          }
        </div>
      </div>

      <pu-profile-session-table />
    </div>
  `,
  selector: 'pu-profile-security',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProfileEditStore, MFAEditStore],
  imports: [
    TranslocoPipe,
    ProfilePasswordEditForm,
    ProfileSessionTable,
    HlmCardImports,
    MFAConfirmCard,
    MFABackupCodesCard,
    MFADisabledCard,
    MFAEnabledCard,
  ],
})
export class ProfileSecurity {
  protected readonly profileEditStore = inject(ProfileEditStore);
  protected readonly mfaEditStore = inject(MFAEditStore);
}
