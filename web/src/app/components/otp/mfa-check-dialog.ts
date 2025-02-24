import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import {InputOTPComponent, REGEXP_ONLY_DIGITS} from '@ngxpert/input-otp';

import {FakeDash, Slot} from '@app/components/otp/slot';
import {injectIsValid} from '@app/form';

@Component({
  template: `
    <h2 mat-dialog-title>Multi-factor code</h2>
    <mat-dialog-content>
      <form
        class="flex flex-col items-center gap-4"
        id="mfa-form"
        [formGroup]="confirmFormGroup"
        (ngSubmit)="dialogRef.close(confirmFormGroup.getRawValue().code)">
        <input-otp
          #otp="inputOtp"
          [maxLength]="6"
          [pattern]="ONLY_DIGITS"
          formControlName="code"
          containerClass="group flex items-center has-[:disabled]:opacity-30">
          <div class="flex">
            @for (
              slot of otp.slots().slice(0, 3);
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
              slot of otp.slots().slice(3, 6);
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
      </form>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button (click)="dialogRef.close()" mat-button>Cancel</button>
      <button [disabled]="!confirmFormGroupValid()" mat-button type="submit" form="mfa-form">
        Confirm
      </button>
    </mat-dialog-actions>
  `,
  selector: 'pu-mfa-check-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
    MatButton,
    FakeDash,
    FormsModule,
    InputOTPComponent,
    ReactiveFormsModule,
    Slot,
  ],
})
export class MFACheckDialog {
  readonly dialogRef = inject(MatDialogRef<MFACheckDialog>);

  protected readonly ONLY_DIGITS = REGEXP_ONLY_DIGITS;

  readonly confirmFormGroup = inject(NonNullableFormBuilder).group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });
  readonly confirmFormGroupValid = injectIsValid(this.confirmFormGroup);
}
