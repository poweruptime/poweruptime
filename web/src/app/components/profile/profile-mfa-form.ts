import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {MatSuffix} from '@angular/material/form-field';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {InputOTPComponent, REGEXP_ONLY_DIGITS} from '@ngxpert/input-otp';
import {DfxImplodePipe} from 'dfx-helper';
import {QRCodeComponent} from 'dfx-qrcode';

import {CopyIconButton} from '@app/components';
import {FakeDash, Slot} from '@app/components/otp';
import {injectIsValid} from '@app/form';
import {ProfileStore} from '@app/services';
import {MFAEditStore} from '@app/services/profile/mfa-edit.store';

@Component({
  template: `
    @let mfaState = mfaEditStore.state();

    @switch (mfaState) {
      @case ('DISABLED') {
        <div class="flex flex-col gap-4">
          <div
            class="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-gray-800 dark:text-blue-400"
            role="alert">
            {{ 'mfa.disabled' | transloco }}
          </div>
          <button (click)="mfaEditStore.setup()" type="button" mat-flat-button>
            {{ 'general.setup' | transloco }}
          </button>
        </div>
      }
      @case ('CONFIRM') {
        <div class="flex flex-col items-center gap-4">
          @let secret = mfaEditStore.base32Secret() ?? '';

          <div class="rounded-md bg-white p-4">
            <qrcode
              [data]="'otpauth://totp/' + email() + '?issuer=poweruptime&secret=' + secret"
              margin="0" />
          </div>

          <mat-form-field class="w-full max-w-72" subscriptSizing="dynamic">
            <mat-label>{{ 'general.secret' | transloco }}</mat-label>
            <input [value]="secret" matInput readonly />

            <pu-copy-icon-button [content]="secret" matSuffix />
          </mat-form-field>

          <form
            class="flex w-full max-w-72 flex-col items-center gap-4"
            [formGroup]="confirmFormGroup"
            (ngSubmit)="mfaEditStore.confirm(confirmFormGroup.getRawValue())">
            <input-otp
              class="w-full"
              #setupOtp="inputOtp"
              [maxLength]="6"
              [pattern]="ONLY_DIGITS"
              formControlName="code"
              containerClass="group w-full flex items-center justify-between has-disabled:opacity-30">
              <div class="flex">
                @for (
                  slot of setupOtp.slots().slice(0, 3);
                  track $index;
                  let first = $first;
                  let last = $last
                ) {
                  <pu-otp-slot
                    [isActive]="slot.isActive"
                    [char]="slot.char"
                    [placeholderChar]="slot.placeholderChar"
                    [hasFakeCaret]="slot.hasFakeCaret"
                    [first]="first"
                    [last]="last" />
                }
              </div>
              <pu-otp-fake-dash />
              <div class="flex">
                @for (
                  slot of setupOtp.slots().slice(3, 6);
                  track $index + 3;
                  let last = $last;
                  let first = $first
                ) {
                  <pu-otp-slot
                    [isActive]="slot.isActive"
                    [char]="slot.char"
                    [placeholderChar]="slot.placeholderChar"
                    [hasFakeCaret]="slot.hasFakeCaret"
                    [first]="first"
                    [last]="last" />
                }
              </div>
            </input-otp>

            <button class="w-full max-w-72" [disabled]="!confirmFormGroupValid()" mat-flat-button>
              {{ 'general.confirm' | transloco }}
            </button>
          </form>
        </div>
      }
      @case ('ENABLED') {
        <div class="flex flex-col gap-4">
          <!-- ['123456', '123456', '123456', '123456', '123456', '123456', '123456', '123456', '123456'] -->
          @if (mfaEditStore.backupCodes(); as backupCodes) {
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-xl">{{ 'mfa.backupCodes' | transloco }}</h3>
              <pu-copy-icon-button [content]="backupCodes | s_implode: ', '" />
            </div>
            <div class="flex flex-col gap-2">
              @for (backupCode of backupCodes; track backupCode) {
                <span>{{ backupCode }}</span>
              }
            </div>
            <mat-divider />
          } @else {
            <div
              class="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-gray-800 dark:text-blue-400"
              role="alert">
              {{ 'mfa.enabled' | transloco }}
              <br />
              <br />
              {{ 'mfa.alreadyShown' | transloco }}
            </div>
          }
          <button class="w-full" (click)="mfaEditStore.delete()" mat-flat-button>
            {{ 'general.disable' | transloco }}
          </button>
        </div>
      }
    }
  `,
  selector: 'pu-profile-mfa-form',
  providers: [MFAEditStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QRCodeComponent,
    InputOTPComponent,
    MatButton,
    Slot,
    FakeDash,
    ReactiveFormsModule,
    MatDivider,
    CopyIconButton,
    DfxImplodePipe,
    MatInput,
    MatLabel,
    MatFormField,
    MatSuffix,
    TranslocoPipe,
  ],
})
export class ProfileMFAForm {
  readonly mfaEditStore = inject(MFAEditStore);
  readonly email = inject(ProfileStore).email;

  readonly confirmFormGroup = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });
  readonly confirmFormGroupValid = injectIsValid(this.confirmFormGroup);

  readonly ONLY_DIGITS = REGEXP_ONLY_DIGITS;
}
