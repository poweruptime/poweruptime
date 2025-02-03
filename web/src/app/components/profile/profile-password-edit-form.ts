import {JsonPipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {BackendType, Database} from '@app/api';
import {
  AbstractModelEditFormComponent,
  SaveButton,
  injectIsValid,
  passwordMatchValidator,
} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="flex flex-col" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field>
        <mat-label>Current Password</mat-label>
        <input matInput formControlName="oldPassword" type="password" />
      </mat-form-field>

      <ng-container formGroupName="password">
        <mat-form-field>
          <mat-label>New password</mat-label>
          <input matInput formControlName="newPassword" type="password" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>New password confirm</mat-label>
          <input matInput formControlName="confirmPassword" type="password" />
        </mat-form-field>

        @if (form.controls.password.errors?.['mismatch']) {
          <mat-error class="mb-4">Password mismatch!</mat-error>
        }
      </ng-container>

      <pu-save-button [valid]="valid" text="profile.password.update" />
    </form>
  `,
  selector: 'pu-profile-password-form',
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel, SaveButton, MatError],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePasswordEditForm extends AbstractModelEditFormComponent<
  BackendType['UpdatePasswordDto'],
  BackendType['UpdatePasswordDto']
> {
  override form = this.fb.nonNullable.group({
    oldPassword: ['', [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)]],
    password: this.fb.nonNullable.group(
      {
        newPassword: [
          '',
          [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)],
        ],
        confirmPassword: [
          '',
          [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)],
        ],
      },
      {validators: passwordMatchValidator},
    ),
  });

  isValid = injectIsValid(this.form);

  override overrideRawValue(
    it: ReturnType<typeof this.form.getRawValue>,
  ): BackendType['UpdatePasswordDto'] {
    this.reset();

    return {
      oldPassword: it.oldPassword,
      newPassword: it.password.newPassword,
    };
  }
}
