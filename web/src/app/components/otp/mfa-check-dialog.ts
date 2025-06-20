import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {MatButton} from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {InputOTPComponent, REGEXP_ONLY_DIGITS} from '@ngxpert/input-otp';

import {injectIsValid} from '@app/form';

import {FakeDash, Slot} from './slot';

@Component({
  template: `
    <h2 mat-dialog-title>{{ 'mfa.dialog.title' | transloco }}</h2>
    <mat-dialog-content>
      <div class="flex h-32 flex-col items-end gap-4 pt-3">
        <form
          id="mfa-form"
          [formGroup]="confirmFormGroup"
          (ngSubmit)="dialogRef.close(confirmFormGroup.getRawValue().code)">
          @if (useBackupCode()) {
            <mat-form-field subscriptSizing="dynamic">
              <mat-label>{{ 'mfa.dialog.backupCode' | transloco }}</mat-label>
              <input matInput formControlName="code" />
            </mat-form-field>
          } @else {
            <input-otp
              #otp="inputOtp"
              [maxLength]="6"
              [pattern]="ONLY_DIGITS"
              formControlName="code"
              containerClass="group flex items-center has-disabled:opacity-30">
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
          }
        </form>

        <mat-slide-toggle [(ngModel)]="useBackupCode">
          {{ 'mfa.dialog.useBackupCode' | transloco }}
        </mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button (click)="dialogRef.close()" type="button" mat-button>
        {{ 'general.cancel' | transloco }}
      </button>
      <button [disabled]="!confirmFormGroupValid()" mat-button type="submit" form="mfa-form">
        {{ 'general.confirm' | transloco }}
      </button>
    </mat-dialog-actions>
  `,
  selector: 'pu-mfa-check-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
    MatFormField,
    MatLabel,
    MatButton,
    MatSlideToggle,
    ReactiveFormsModule,
    FormsModule,
    InputOTPComponent,
    FakeDash,
    Slot,
    MatInput,
    TranslocoPipe,
  ],
})
export class MFACheckDialog {
  readonly dialogRef = inject(MatDialogRef<MFACheckDialog>);

  protected readonly ONLY_DIGITS = REGEXP_ONLY_DIGITS;

  private readonly fb = inject(NonNullableFormBuilder);

  readonly confirmFormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });
  readonly confirmFormGroupValid = injectIsValid(this.confirmFormGroup);

  useBackupCode = signal(false);

  constructor() {
    effect(() => {
      const useBackupCode = this.useBackupCode();
      if (useBackupCode) {
        this.confirmFormGroup.controls.code.setValidators([
          Validators.required,
          Validators.minLength(25),
          Validators.maxLength(25),
        ]);
      } else {
        this.confirmFormGroup.controls.code.setValidators([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
        ]);
      }
    });
  }
}
