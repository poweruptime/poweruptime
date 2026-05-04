import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnDialogClose, BrnDialogRef} from '@spartan-ng/brain/dialog';
import {BrnInputOtpImports} from '@spartan-ng/brain/input-otp';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmDialogImports} from '@spartan-ng/helm/dialog';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmInputOtpImports} from '@spartan-ng/helm/input-otp';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import {Database} from '../../api';
import {injectIsValid} from '../../form';

@Component({
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>{{ 'mfa.dialog.title' | transloco }}</h3>
    </hlm-dialog-header>
    <div class="mt-4 space-y-6">
      <form
        class="grid min-w-64 gap-4"
        id="mfa-form"
        [formGroup]="confirmFormGroup"
        (ngSubmit)="dialogRef.close(confirmFormGroup.getRawValue().code)">
        @if (confirmFormGroup.controls.useBackupCode.value) {
          <input
            class="w-full"
            [placeholder]="'general.backupCode' | transloco"
            formControlName="code"
            hlmInput />
        } @else {
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
        }

        <label class="flex items-center" hlmLabel for="useBackupCode">
          <hlm-switch class="mr-2" inputId="useBackupCode" formControlName="useBackupCode" />
          {{ 'mfa.dialog.useBackupCode' | transloco }}
        </label>
      </form>
    </div>
    <hlm-dialog-footer class="mt-8">
      <button type="button" hlmBtn variant="outline" brnDialogClose>
        {{ 'general.cancel' | transloco }}
      </button>
      <button [disabled]="!confirmFormGroupValid()" type="submit" hlmBtn form="mfa-form">
        {{ 'general.confirm' | transloco }}
      </button>
    </hlm-dialog-footer>
  `,
  host: {
    class: 'sm:max-w-[425px]',
  },
  selector: 'pu-mfa-check-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    HlmInputOtpImports,
    BrnInputOtpImports,
    HlmButtonImports,
    HlmDialogImports,
    BrnDialogClose,
    HlmInputImports,
    HlmLabelImports,
    HlmSwitchImports,
  ],
})
export class MFACheckDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly dialogRef = inject<BrnDialogRef<string>>(BrnDialogRef);

  readonly confirmFormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    useBackupCode: [false],
  });
  readonly confirmFormGroupValid = injectIsValid(this.confirmFormGroup);

  constructor() {
    const useBackupCode$ = toSignal(this.confirmFormGroup.controls.useBackupCode.valueChanges, {
      initialValue: false,
    });
    effect(() => {
      const useBackupCode = useBackupCode$();
      if (useBackupCode) {
        this.confirmFormGroup.controls.code.setValidators([
          Validators.required,
          Validators.minLength(25),
          Validators.maxLength(25),
        ]);
      } else {
        this.confirmFormGroup.controls.code.setValidators([
          Validators.required,
          Validators.pattern(Database.INTEGER_REGEX),
          Validators.minLength(6),
          Validators.maxLength(6),
        ]);
      }
    });
  }
}
