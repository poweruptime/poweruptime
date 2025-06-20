import {Component, effect, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {Database} from '@app/api';
import {PasswordShowButton, injectIsValid, passwordMatchValidator} from '@app/form';
import {AuthStore} from '@app/services';

@Component({
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          <strong>poweruptime</strong>
          | {{ 'auth.changePassword' | transloco }}
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form class="mt-6 flex flex-col gap-10" [formGroup]="form" (ngSubmit)="submit()">
          <div class="flex flex-col gap-4">
            <mat-form-field>
              <mat-label>{{ 'general.email' | transloco }}</mat-label>
              <input type="email" matInput formControlName="email" />

              @if (form.controls.email.errors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (form.controls.email.errors?.['email']) {
                <mat-error>{{ 'form.validation.email' | transloco }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>{{ 'auth.oldPassword' | transloco }}</mat-label>
              <input type="password" matInput formControlName="oldPassword" />

              @if (form.controls.oldPassword.errors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (form.controls.oldPassword.errors?.['minlength']; as minlength) {
                <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
              }
            </mat-form-field>

            <ng-container formGroupName="newPassword">
              <mat-form-field>
                <mat-label>{{ 'auth.newPassword' | transloco }}</mat-label>
                <input [type]="showButton.type()" matInput formControlName="newPassword" focus />

                <pu-password-show-button #showButton matSuffix />

                @if (form.controls.newPassword.controls.newPassword.errors?.['required']) {
                  <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                }
                @if (
                  form.controls.newPassword.controls.newPassword.errors?.['minlength'];
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

                @if (form.controls.newPassword.controls.confirmPassword.errors?.['required']) {
                  <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                }
                @if (
                  form.controls.newPassword.controls.confirmPassword.errors?.['minlength'];
                  as minlength
                ) {
                  <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
                }
              </mat-form-field>

              @if (form.controls.newPassword.errors?.['mismatch']) {
                <mat-error>{{ 'form.validation.passwordMismatch' | transloco }}</mat-error>
              }
            </ng-container>

            @if (authStore.error() === 'INVALID_CREDENTIALS') {
              <mat-error>Invalid credentials.</mat-error>
            }
            @if (authStore.error() === 'PASSWORDS_IDENTICAL') {
              <mat-error>Please provide a new and different password.</mat-error>
            }
          </div>

          <div class="flex flex-col gap-3">
            <mat-slide-toggle formControlName="stayLoggedIn">Stay logged in</mat-slide-toggle>

            <button [disabled]="!formValid()" mat-flat-button type="submit">
              <bi class="mr-2" name="envelope" />
              Login
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  selector: 'password-change-login-page',
  imports: [
    ReactiveFormsModule,
    BiComponent,
    MatError,
    MatLabel,
    MatFormField,
    MatInput,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatButton,
    MatSlideToggle,
    DfxAutofocus,
    TranslocoPipe,
    MatSuffix,
    PasswordShowButton,
  ],
})
export class PasswordChangeLoginPage {
  private readonly queryParams = injectQueryParams();
  readonly authStore = inject(AuthStore);
  readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
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
  readonly formValid = injectIsValid(this.form);

  constructor() {
    effect(() => {
      const queryParams = this.queryParams();
      this.form.patchValue({
        email: queryParams?.['email'],
        stayLoggedIn: queryParams?.['stayLoggedIn'],
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
