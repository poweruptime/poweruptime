import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {AuthStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <mat-card class="w-full">
        <mat-card-header>
          <mat-card-title>
            <strong>poweruptime</strong>
            | {{ 'auth.login' | transloco }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field>
              <mat-label>{{ 'general.emailAddress' | transloco }}</mat-label>
              <input type="email" matInput formControlName="email" />

              @let emailErrors = form.controls.email.errors;
              @if (emailErrors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (emailErrors?.['email']) {
                <mat-error>{{ 'form.validation.email' | transloco }}</mat-error>
              }
              @if (emailErrors?.['maxlength']; as maxlength) {
                <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
              }
            </mat-form-field>
            <mat-form-field>
              <mat-label>Password</mat-label>
              <input type="password" matInput formControlName="password" />

              @let passwordErrors = form.controls.password.errors;
              @if (passwordErrors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (passwordErrors?.['minlength']; as minlength) {
                <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
              }
            </mat-form-field>

            @if (authStore.error() === 'INVALID_CREDENTIALS') {
              <mat-error>{{ 'auth.invalidCredentials' | transloco }}</mat-error>
            }

            <div class="flex flex-wrap items-center justify-between gap-2">
              <mat-slide-toggle formControlName="stayLoggedIn">
                {{ 'auth.stayLoggedIn' | transloco }}
              </mat-slide-toggle>
              <a mat-stroked-button routerLink="/auth/forgot-password">
                {{ 'auth.forgotPassword.title' | transloco }}
              </a>
            </div>

            <button [disabled]="!isValid()" mat-flat-button type="submit">
              <bi class="mr-2" name="box-arrow-in-right" />
              {{ 'auth.login' | transloco }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  selector: 'login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    BiComponent,
    MatLabel,
    MatFormField,
    MatInput,
    MatError,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatSlideToggle,
    TranslocoPipe,
    RouterLink,
  ],
})
export class LoginPage {
  authStore = inject(AuthStore);

  form = inject(NonNullableFormBuilder).group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.minLength(Database.MIN_MAIL_LENGTH),
        Validators.maxLength(Database.MAX_MAIL_LENGTH),
      ],
    ],
    password: ['', [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)]],
    stayLoggedIn: [false],
  });
  isValid = injectIsValid(this.form);

  constructor() {
    const queryParams = injectQueryParams();

    effect(() => {
      const _queryParams = queryParams();
      this.form.patchValue({
        email: _queryParams?.['email'],
        password: _queryParams?.['onetimePassword'],
        stayLoggedIn: _queryParams?.['stayLoggedIn'],
      });

      if (this.form.valid) {
        this.submit();
      }
    });
  }

  submit(): void {
    this.authStore.login(this.form.getRawValue());
  }
}
