import {ChangeDetectionStrategy, Component, effect, inject, input, signal} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {Database} from '@app/api';
import {PasswordShowButton, injectIsValid, passwordMatchValidator} from '@app/form';
import {ForgotPasswordStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <section hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle>
            <span class="font-bold">poweruptime</span>
            | {{ 'auth.forgotPassword.title' | transloco }}
          </h3>
        </div>
        @if (state() === 'REQUEST') {
          <form
            class="grid gap-4"
            [formGroup]="requestPasswordResetForm"
            (ngSubmit)="submitRequest()"
            hlmCardContent>
            <hlm-field>
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
              @let emailErrors = requestPasswordResetForm.controls.email.errors;
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

            <button [disabled]="!isRequestPasswordResetFormValid()" hlmBtn type="submit">
              <ng-icon hlm size="sm" name="lucideMailQuestionMark" />
              {{ 'auth.requestPasswordReset' | transloco }}
            </button>
          </form>
        } @else {
          <form
            class="grid gap-4"
            [formGroup]="resetPasswordForm"
            (ngSubmit)="submitReset()"
            hlmCardContent>
            <ng-container formGroupName="newPassword">
              <hlm-field>
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
                @let newPasswordErrors =
                  resetPasswordForm.controls.newPassword.controls.newPassword.errors;
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
                  <pu-password-show-button
                    #showConfirmButton
                    hlmInputGroupAddon
                    align="inline-end" />
                </div>
                @let confirmPasswordErrors =
                  resetPasswordForm.controls.newPassword.controls.confirmPassword.errors;
                @if (confirmPasswordErrors?.['required']) {
                  <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                }
                @if (confirmPasswordErrors?.['minlength']; as minlength) {
                  <hlm-field-error>
                    {{ 'form.validation.minlength' | transloco: minlength }}
                  </hlm-field-error>
                }
              </hlm-field>

              @if (resetPasswordForm.controls.newPassword.errors?.['mismatch']) {
                <hlm-field-error>
                  {{ 'form.validation.passwordMismatch' | transloco }}
                </hlm-field-error>
              }
            </ng-container>

            <button [disabled]="!isResetPasswordFormValid()" hlmBtn type="submit">
              <ng-icon hlm size="sm" name="lucideRotateCcwKey" />
              {{ 'auth.resetPassword' | transloco }}
            </button>
          </form>
        }
      </section>
    }
  `,
  selector: 'pu-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    PasswordShowButton,
    HlmCardImports,
    HlmInputGroupImports,
    HlmLabelImports,
    HlmButtonImports,
    HlmIconImports,
    HlmFieldImports,
  ],
})
export class ForgotPasswordPage {
  private readonly forgotPasswordStore = inject(ForgotPasswordStore);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly email = input<string>();
  protected readonly resetToken = input<string>();

  state = signal<'REQUEST' | 'RESET'>('REQUEST');

  requestPasswordResetForm = this.fb.group({
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
  isRequestPasswordResetFormValid = injectIsValid(this.requestPasswordResetForm);

  resetPasswordForm = this.fb.group({
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
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.minLength(Database.MIN_MAIL_LENGTH),
        Validators.maxLength(Database.MAX_MAIL_LENGTH),
      ],
    ],
    resetToken: ['', [Validators.required]],
  });
  isResetPasswordFormValid = injectIsValid(this.resetPasswordForm);

  constructor() {
    effect(() => {
      const body = {
        email: this.email(),
        resetToken: this.resetToken(),
      };

      if (body.email && body.email.length > 0 && body.resetToken && body.resetToken.length > 0) {
        this.state.set('RESET');
        this.resetPasswordForm.patchValue(body);
      }
    });
  }

  submitRequest(): void {
    this.forgotPasswordStore.forgotPassword(this.requestPasswordResetForm.getRawValue());
  }

  submitReset(): void {
    const value = this.resetPasswordForm.getRawValue();
    this.forgotPasswordStore.forgotPasswordUpdate({
      ...value,
      newPassword: value.newPassword.newPassword,
    });
  }
}
