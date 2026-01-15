import {Component, booleanAttribute, effect, inject, input} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import {Database} from '@app/api';
import {PasswordShowButton, injectIsValid, passwordMatchValidator} from '@app/form';
import {AuthStore} from '@app/services';

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>
          <span class="font-bold">poweruptime</span>
          | {{ 'auth.changePassword' | transloco }}
        </h3>
      </div>

      <form class="grid gap-10" [formGroup]="form" (ngSubmit)="submit()" hlmCardContent>
        <div class="grid gap-4">
          <hlm-form-field>
            <label hlmLabel for="email">
              {{ 'general.emailAddress' | transloco }}
            </label>
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
            @if (emailErrors?.['maxlength']; as maxlength) {
              <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
            }
          </hlm-form-field>

          <hlm-form-field>
            <label hlmLabel for="oldPassword">
              {{ 'auth.oldPassword' | transloco }}
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
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (oldPasswordErrors?.['minlength']; as minlength) {
              <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
            }
          </hlm-form-field>

          <ng-container formGroupName="newPassword">
            <hlm-form-field>
              <label hlmLabel for="newPassword">{{ 'auth.newPassword' | transloco }}</label>

              <div hlmInputGroup>
                <input
                  id="newPassword"
                  [type]="showButton.type()"
                  [placeholder]="showButton.placeholder()"
                  hlmInputGroupInput
                  formControlName="newPassword" />
                <pu-password-show-button #showButton hlmInputGroupAddon align="inline-end" />
              </div>
              @let newPasswordErrors = form.controls.newPassword.controls.newPassword.errors;
              @if (newPasswordErrors?.['required']) {
                <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
              }
              @if (newPasswordErrors?.['minlength']; as minlength) {
                <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
              }
            </hlm-form-field>

            <hlm-form-field>
              <label hlmLabel for="newPasswordConfirm">
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
              @let confirmPasswordErrors =
                form.controls.newPassword.controls.confirmPassword.errors;
              @if (confirmPasswordErrors?.['required']) {
                <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
              }
              @if (confirmPasswordErrors?.['minlength']; as minlength) {
                <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
              }
            </hlm-form-field>

            @if (form.controls.newPassword.errors?.['mismatch']) {
              <hlm-error>{{ 'form.validation.passwordMismatch' | transloco }}</hlm-error>
            }
          </ng-container>

          @if (authStore.error() === 'INVALID_CREDENTIALS') {
            <hlm-error>Invalid credentials.</hlm-error>
          }
          @if (authStore.error() === 'PASSWORDS_IDENTICAL') {
            <hlm-error>Please provide a new and different password.</hlm-error>
          }
        </div>

        <div class="grid gap-3">
          <label class="flex items-center" hlmLabel for="stayLoggedIn">
            <hlm-switch class="mr-2" id="stayLoggedIn" formControlName="stayLoggedIn" />
            {{ 'auth.stayLoggedIn' | transloco }}
          </label>

          <button id="password-change-button" [disabled]="!formValid()" hlmBtn type="submit">
            <ng-icon class="mr-2" name="bootstrapEnvelope" />
            Login
          </button>
        </div>
      </form>
    </section>
  `,
  selector: 'password-change-login-page',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    TranslocoPipe,
    PasswordShowButton,
    HlmCardImports,
    HlmFormFieldImports,
    HlmLabelImports,
    HlmInputGroupImports,
    HlmSwitchImports,
    HlmButtonImports,
  ],
})
export class PasswordChangeLoginPage {
  email = input<string>();
  stayLoggedIn = input(false, {transform: booleanAttribute});

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly authStore = inject(AuthStore);

  protected readonly form = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.minLength(Database.MIN_MAIL_LENGTH),
        Validators.maxLength(Database.MAX_MAIL_LENGTH),
      ],
    ],
    oldPassword: ['', [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)]],
    newPassword: this.fb.group(
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
    stayLoggedIn: [false],
  });
  protected readonly formValid = injectIsValid(this.form);

  constructor() {
    effect(() => {
      this.form.patchValue({
        email: this.email(),
        stayLoggedIn: this.stayLoggedIn(),
      });
    });

    this.form.controls.oldPassword.setValue(this.authStore.enteredPassword() ?? '');
  }

  submit(): void {
    const rawValue = this.form.getRawValue();
    this.authStore.loginWithPasswordChange({
      ...rawValue,
      newPassword: rawValue.newPassword.newPassword,
    });
  }
}
