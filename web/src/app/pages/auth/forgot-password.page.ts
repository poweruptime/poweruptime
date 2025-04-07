import {ChangeDetectionStrategy, Component, effect, inject, signal} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {Database} from '@app/api';
import {PasswordShowButton, injectIsValid, passwordMatchValidator} from '@app/form';
import {AuthStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <mat-card class="w-full">
        <mat-card-header>
          <mat-card-title>
            <strong>poweruptime</strong>
            | {{ 'auth.forgotPassword' | transloco }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (state() === 'REQUEST') {
            <form
              class="mt-6 grid gap-4"
              [formGroup]="requestPasswordResetForm"
              (ngSubmit)="submitRequest()">
              <mat-form-field>
                <mat-label>{{ 'general.emailAddress' | transloco }}</mat-label>
                <input matInput formControlName="email" />

                @let emailErrors = requestPasswordResetForm.controls.email.errors;
                @if (emailErrors?.['required']) {
                  <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                }
                @if (emailErrors?.['email']) {
                  <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                }
                @if (emailErrors?.['minlength']; as minlength) {
                  <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
                }
                @if (emailErrors?.['maxlength']; as maxlength) {
                  <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
                }
              </mat-form-field>

              <button [disabled]="!isRequestPasswordResetFormValid()" mat-flat-button type="submit">
                <bi class="mr-2" name="box-arrow-in-right" />
                {{ 'auth.requestPasswordReset' | transloco }}
              </button>
            </form>
          } @else {
            <form
              class="mt-6 grid gap-4"
              [formGroup]="resetPasswordForm"
              (ngSubmit)="submitReset()">
              <ng-container formGroupName="newPassword">
                <mat-form-field>
                  <mat-label>{{ 'auth.newPassword' | transloco }}</mat-label>
                  <input [type]="showButton.type()" matInput formControlName="newPassword" focus />

                  <pu-password-show-button #showButton matSuffix />

                  @if (
                    resetPasswordForm.controls.newPassword.controls.newPassword.errors?.['required']
                  ) {
                    <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                  }
                  @if (
                    resetPasswordForm.controls.newPassword.controls.newPassword.errors?.[
                      'minlength'
                    ];
                    as minlength
                  ) {
                    <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
                  }
                </mat-form-field>

                <mat-form-field>
                  <mat-label>{{ 'auth.newPasswordConfirm' | transloco }}</mat-label>
                  <input
                    [type]="showConfirmButton.type()"
                    matInput
                    formControlName="confirmPassword" />

                  <pu-password-show-button #showConfirmButton matSuffix />

                  @if (
                    resetPasswordForm.controls.newPassword.controls.confirmPassword.errors?.[
                      'required'
                    ]
                  ) {
                    <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                  }
                  @if (
                    resetPasswordForm.controls.newPassword.controls.confirmPassword.errors?.[
                      'minlength'
                    ];
                    as minlength
                  ) {
                    <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
                  }
                </mat-form-field>

                @if (resetPasswordForm.controls.newPassword.errors?.['mismatch']) {
                  <mat-error>{{ 'form.validation.passwordMismatch' | transloco }}</mat-error>
                }
              </ng-container>

              <button [disabled]="!isResetPasswordFormValid()" mat-flat-button type="submit">
                <bi class="mr-2" name="box-arrow-in-right" />
                {{ 'auth.resetPassword' | transloco }}
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    }
  `,
  selector: 'pu-forgot-password-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    BiComponent,
    MatLabel,
    MatFormField,
    MatInput,
    MatError,
    MatSuffix,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    TranslocoPipe,
    DfxAutofocus,
    PasswordShowButton,
  ],
})
export class ForgotPasswordPage {
  readonly authStore = inject(AuthStore);
  readonly fb = inject(NonNullableFormBuilder);

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
    const queryParams = injectQueryParams();
    effect(() => {
      const _queryParams = queryParams();
      const body = {
        email: _queryParams?.['email'],
        resetToken: _queryParams?.['resetToken'],
      };

      if (body.email && body.email.length > 0 && body.resetToken && body.resetToken.length > 0) {
        this.state.set('RESET');
        this.resetPasswordForm.patchValue(body);
      }
    });
  }

  submitRequest(): void {
    this.authStore.forgotPassword(this.requestPasswordResetForm.getRawValue());
  }

  submitReset(): void {
    const value = this.resetPasswordForm.getRawValue();
    this.authStore.forgotPasswordUpdate({
      ...value,
      newPassword: value.newPassword.newPassword,
    });
  }
}
