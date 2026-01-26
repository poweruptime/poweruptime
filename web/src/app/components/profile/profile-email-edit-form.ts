import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid, notEqual} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="grid gap-4" id="email-form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <span class="mb-4">{{ 'profile.email.current' | transloco }}: {{ email() }}</span>

      <hlm-form-field>
        <label hlmLabel for="email">{{ 'profile.email.new' | transloco }}</label>
        <div hlmInputGroup>
          <input
            id="email"
            hlmInputGroupInput
            formControlName="email"
            type="email"
            placeholder="you@example.com" />
          <div hlmInputGroupAddon>
            <ng-icon name="lucideMail" />
          </div>
        </div>
        @let emailErrors = form.controls.email.errors;
        @if (emailErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (emailErrors?.['email']) {
          <hlm-error>{{ 'form.validation.email' | transloco }}</hlm-error>
        }
        @if (emailErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (emailErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
      </hlm-form-field>

      <hlm-form-field>
        <label hlmLabel for="password">{{ 'general.password' | transloco }}</label>

        <div hlmInputGroup>
          <input
            id="password"
            hlmInputGroupInput
            formControlName="password"
            type="password"
            placeholder="********" />
        </div>
        @let passwordErrors = form.controls.password.errors;
        @if (passwordErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (passwordErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
      </hlm-form-field>

      <pu-save-button
        [valid]="valid"
        [text]="'profile.email.requestChange' | transloco"
        form="email-form" />
    </form>
  `,
  selector: 'pu-profile-email-form',
  imports: [
    SaveButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmFormFieldImports,
    HlmInputGroupImports,
    HlmIconImports,
    HlmLabelImports,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEmailEditForm extends AbstractModelEditFormComponent<
  BackendType['UpdateEmailDto'],
  BackendType['UpdateEmailDto']
> {
  override disableInputFocus = true;

  override form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)]],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.minLength(Database.MIN_MAIL_LENGTH),
        Validators.maxLength(Database.MAX_MAIL_LENGTH),
      ],
    ],
  });

  isValid = injectIsValid(this.form);

  email = input(undefined, {
    transform: (email: string | undefined) => {
      if (!email) {
        return undefined;
      }

      this.form.controls.email.addValidators([notEqual(email)]);

      return email;
    },
  });

  override overrideRawValue(it: unknown): unknown {
    this.reset();
    return it;
  }
}
