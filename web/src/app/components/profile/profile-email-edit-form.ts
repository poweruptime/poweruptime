import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid, notEqual} from '@app/form';
import {HlmFieldImports} from '@spartan-ng/helm/field';

@Component({
  template: `
    @let valid = isValid();

    <form class="grid gap-4" id="email-form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <span class="mb-4">{{ 'profile.email.current' | transloco }}: {{ email() }}</span>

      <hlm-field>
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
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (emailErrors?.['email']) {
          <hlm-field-error>{{ 'form.validation.email' | transloco }}</hlm-field-error>
        }
        @if (emailErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (emailErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
      </hlm-field>

      <hlm-field>
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
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (passwordErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
      </hlm-field>

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
    HlmInputGroupImports,
    HlmIconImports,
    HlmLabelImports,
    HlmFieldImports,
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
