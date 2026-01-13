import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {
  AbstractModelEditFormComponent,
  PasswordShowButton,
  SaveButton,
  injectIsValid,
  passwordMatchValidator,
} from '@app/form';

@Component({
  template: `
    <form
      class="flex flex-col"
      id="password-form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      <mat-form-field>
        <mat-label>{{ 'profile.password.currentPassword' | transloco }}</mat-label>
        <input matInput formControlName="oldPassword" type="password" />

        @if (form.controls.oldPassword.errors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (form.controls.oldPassword.errors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
      </mat-form-field>

      <ng-container formGroupName="password">
        <mat-form-field>
          <mat-label>{{ 'auth.newPassword' | transloco }}</mat-label>
          <input [type]="showButton.type()" matInput formControlName="newPassword" />

          <pu-password-show-button #showButton matSuffix />

          @if (form.controls.password.controls.newPassword.errors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (form.controls.password.controls.newPassword.errors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ 'auth.newPasswordConfirm' | transloco }}</mat-label>
          <input [type]="confirmShowButton.type()" matInput formControlName="confirmPassword" />

          <pu-password-show-button #confirmShowButton matSuffix />

          @if (form.controls.password.controls.confirmPassword.errors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (
            form.controls.password.controls.confirmPassword.errors?.['minlength'];
            as minlength
          ) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
        </mat-form-field>

        @if (
          (form.controls.password.controls.confirmPassword.value.length > 0 ||
            form.controls.password.controls.newPassword.value.length > 0) &&
          form.controls.password.errors?.['mismatch']
        ) {
          <mat-error>{{ 'form.validation.passwordMismatch' | transloco }}</mat-error>
        }
      </ng-container>

      <pu-save-button
        [valid]="isValid()"
        [text]="'profile.password.update' | transloco"
        form="password-form" />
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
    MatSuffix,
    PasswordShowButton,
    TranslocoPipe,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePasswordEditForm extends AbstractModelEditFormComponent<
  BackendType['UpdatePasswordDto'],
  BackendType['UpdatePasswordDto']
> {
  override disableInputFocus = true;

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
