import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnInputOtpImports} from '@spartan-ng/brain/input-otp';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputOtpImports} from '@spartan-ng/helm/input-otp';
import {QRCodeComponent} from 'dfx-qrcode';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {MFAEditStore, ProfileStore} from '@app/services';

import {CopyIconButton} from '../../copy-icon-button';

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ 'mfa.mfa' | transloco }}</h3>
        <span hlmCardDescription>{{ 'mfa.confirm.description' | transloco }}</span>
      </div>
      <div class="grid gap-4 md:grid-cols-2" hlmCardContent>
        <div class="flex flex-col items-center gap-4">
          @let secret = mfaEditStore.base32Secret() ?? '';

          <div class="rounded-md bg-white p-4">
            <qrcode
              [data]="'otpauth://totp/' + email() + '?issuer=poweruptime&secret=' + secret"
              margin="0" />
          </div>

          <div class="space-y-2">
            <span class="text-muted-foreground text-xs tracking-wide uppercase">
              {{ 'general.secret' | transloco }}
            </span>
            <div class="group relative">
              <div
                class="bg-secondary/50 border-border/50 flex items-center justify-between rounded-md border px-4 py-3 font-mono text-sm">
                <code class="text-foreground">{{ secret }}</code>
                <pu-copy-icon-button [content]="secret" />
              </div>
            </div>
          </div>
        </div>

        <form
          class="flex flex-col gap-4"
          [formGroup]="confirmFormGroup"
          (ngSubmit)="mfaEditStore.confirm(confirmFormGroup.getRawValue())">
          <span>{{ 'mfa.confirm.label' | transloco }}</span>
          <brn-input-otp
            hlmInputOtp
            maxLength="6"
            formControlName="code"
            inputClass="disabled:cursor-not-allowed">
            <div hlmInputOtpGroup>
              <hlm-input-otp-slot index="0" />
              <hlm-input-otp-slot index="1" />
              <hlm-input-otp-slot index="2" />
            </div>
            <hlm-input-otp-separator />
            <div hlmInputOtpGroup>
              <hlm-input-otp-slot index="3" />
              <hlm-input-otp-slot index="4" />
              <hlm-input-otp-slot index="5" />
            </div>
          </brn-input-otp>

          <button [disabled]="!confirmFormGroupValid()" hlmBtn type="submit">
            {{ 'mfa.confirm.confirm' | transloco }}
            <ng-icon hlm size="sm" name="bootstrapArrowRight" />
          </button>
        </form>
      </div>
    </section>
  `,
  selector: 'pu-mfa-confirm-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QRCodeComponent,
    ReactiveFormsModule,
    CopyIconButton,
    TranslocoPipe,
    HlmInputOtpImports,
    BrnInputOtpImports,
    HlmButtonImports,
    HlmIconImports,
    HlmCardImports,
  ],
})
export class MFAConfirmCard {
  readonly mfaEditStore = inject(MFAEditStore);
  readonly email = inject(ProfileStore).email;

  readonly confirmFormGroup = inject(NonNullableFormBuilder).group({
    code: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(Database.INTEGER_REGEX),
      ],
    ],
  });
  readonly confirmFormGroupValid = injectIsValid(this.confirmFormGroup);
}
