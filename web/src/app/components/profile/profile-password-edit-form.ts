import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';

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
    <form class="grid gap-4" id="password-form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <hlm-field>
        <label hlmFieldLabel for="oldPassword">
          {{ 'profile.password.currentPassword' | transloco }}
        </label>

        <div hlmInputGroup>
          <input
            id="oldPassword"
            hlmInputGroupInput
            formControlName="oldPassword"
            type="password"
            placeholder="********" />
        </div>
        @let oldPasswordErrors = form.controls.oldPassword.errors;
        @if (oldPasswordErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (oldPasswordErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
      </hlm-field>

      <ng-container formGroupName="password">
        <hlm-field>
          <label hlmFieldLabel for="newPassword">{{ 'auth.newPassword' | transloco }}</label>

          <div hlmInputGroup>
            <input
              id="newPassword"
              [type]="showButton.type()"
              [placeholder]="showButton.placeholder()"
              hlmInputGroupInput
              formControlName="newPassword" />
            <pu-password-show-button #showButton hlmInputGroupAddon align="inline-end" />
          </div>
          @let newPasswordErrors = form.controls.password.controls.newPassword.errors;
          @if (newPasswordErrors?.['required']) {
            <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
          }
          @if (newPasswordErrors?.['minlength']; as minlength) {
            <hlm-field-error>
              {{ 'form.validation.minlength' | transloco: minlength }}
            </hlm-field-error>
          }
        </hlm-field>

        <hlm-field>
          <label hlmFieldLabel for="newPasswordConfirm">
            {{ 'auth.newPasswordConfirm' | transloco }}
          </label>

          <div hlmInputGroup>
            <input
              id="newPasswordConfirm"
              [type]="showConfirmButton.type()"
              [placeholder]="showConfirmButton.placeholder()"
              hlmInputGroupInput
              formControlName="confirmPassword" />
            <pu-password-show-button #showConfirmButton hlmInputGroupAddon align="inline-end" />
          </div>
          @let confirmPasswordErrors = form.controls.password.controls.confirmPassword.errors;
          @if (confirmPasswordErrors?.['required']) {
            <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
          }
          @if (confirmPasswordErrors?.['minlength']; as minlength) {
            <hlm-field-error>
              {{ 'form.validation.minlength' | transloco: minlength }}
            </hlm-field-error>
          }
        </hlm-field>

        @if (form.controls.password.errors?.['mismatch']) {
          <hlm-field-error>{{ 'form.validation.passwordMismatch' | transloco }}</hlm-field-error>
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
    SaveButton,
    PasswordShowButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmInputGroupImports,
    HlmLabelImports,
    HlmFieldImports,
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
