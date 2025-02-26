import {ChangeDetectionStrategy, Component, signal} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {BiComponent} from 'dfx-bootstrap-icons';

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
        @let _showPassword = showPassword();

        <mat-form-field>
          <mat-label>New password</mat-label>
          <input
            [type]="_showPassword ? 'text' : 'password'"
            matInput
            formControlName="newPassword" />

          <button
            (click)="showPassword.set(!_showPassword)"
            matSuffix
            type="button"
            mat-icon-button>
            @if (_showPassword) {
              <bi name="eye-fill" />
            } @else {
              <bi name="eye-slash-fill" />
            }
          </button>
        </mat-form-field>

        <mat-form-field>
          <mat-label>New password confirm</mat-label>
          <input
            [type]="_showPassword ? 'text' : 'password'"
            matInput
            formControlName="confirmPassword" />

          <button
            (click)="showPassword.set(!_showPassword)"
            matSuffix
            type="button"
            mat-icon-button>
            @if (_showPassword) {
              <bi name="eye-fill" />
            } @else {
              <bi name="eye-slash-fill" />
            }
          </button>
        </mat-form-field>

        @if (form.controls.password.errors?.['mismatch']) {
          <mat-error class="mb-4">Password mismatch!</mat-error>
        }
      </ng-container>

      <!-- @jsverse/transloco -->
      <!-- t(profile.password.update) -->
      <pu-save-button [valid]="valid" text="profile.password.update" />
    </form>
  `,
  selector: 'pu-profile-password-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    SaveButton,
    MatError,
    BiComponent,
    MatIconButton,
    MatSuffix,
  ],
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

  readonly isValid = injectIsValid(this.form);

  readonly showPassword = signal(false);

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
