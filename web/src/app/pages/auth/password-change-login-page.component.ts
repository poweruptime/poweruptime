import {Component, effect, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {AuthStore} from '../../services/auth.store';

@Component({
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          <strong>poweruptime</strong>
          | Change password
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (formChange()) {}
        <form class="mt-6 flex flex-col gap-10" [formGroup]="form" (ngSubmit)="submit()">
          <div class="flex flex-col gap-4">
            <mat-form-field>
              <mat-label>Email</mat-label>
              <input type="email" matInput formControlName="email" />

              @if (form.controls.email.invalid) {
                <mat-error>E-Mail address invalid</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>Old Password</mat-label>
              <input type="password" matInput formControlName="oldPassword" />

              @if (form.controls.oldPassword.invalid) {
                <mat-error>Password needs to have at least 6 characters.</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>New Password</mat-label>
              <input type="password" matInput formControlName="newPassword" focus />

              @if (form.controls.newPassword.invalid) {
                <mat-error>Password needs to have at least 6 characters.</mat-error>
              }
            </mat-form-field>

            @if (authStore.error() === 'INVALID_CREDENTIALS') {
              <mat-error>Invalid credentials.</mat-error>
            }
            @if (authStore.error() === 'PASSWORDS_IDENTICAL') {
              <mat-error>Please provide a new and different password.</mat-error>
            }
          </div>

          <div class="flex flex-col gap-3">
            <mat-slide-toggle formControlName="stayLoggedIn">Stay logged in</mat-slide-toggle>

            <button [disabled]="form.invalid" mat-flat-button type="submit">
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
  ],
})
export class PasswordChangeLoginPage {
  private queryParams = injectQueryParams();

  authStore = inject(AuthStore);

  form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    oldPassword: ['', [Validators.required, Validators.minLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    stayLoggedIn: [false],
  });
  formChange = toSignal(this.form.valueChanges);

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
    this.authStore.loginWithPasswordChange(this.form.getRawValue());
  }
}
