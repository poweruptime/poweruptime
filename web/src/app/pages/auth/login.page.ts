import {ChangeDetectionStrategy, Component, effect, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {BiComponent} from 'dfx-bootstrap-icons';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';

import {AuthStore} from '../../services/auth.store';

@Component({
  template: `
    @defer (on timer(50)) {
      <mat-card class="min-w-96">
        <mat-card-header>
          <mat-card-title>
            <strong>poweruptime</strong>
            | Sign in
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
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
                <mat-label>Password</mat-label>
                <input type="password" matInput formControlName="password" />

                @if (form.controls.password.invalid) {
                  <mat-error>Password needs to have at least 6 characters.</mat-error>
                }
              </mat-form-field>

              @if (authStore.error() === 'INVALID_CREDENTIALS') {
                <mat-error>Invalid credentials.</mat-error>
              }
            </div>

            <div class="flex flex-col gap-3">
              <mat-slide-toggle formControlName="stayLoggedIn">Stay logged in</mat-slide-toggle>

              <button [disabled]="!isValid()" mat-flat-button type="submit">
                <bi class="mr-2" name="envelope" />
                Login
              </button>
            </div>
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
  ],
})
export class LoginPage {
  private queryParams = injectQueryParams();

  authStore = inject(AuthStore);

  form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)]],
    stayLoggedIn: [false],
  });
  isValid = injectIsValid(this.form);

  constructor() {
    effect(() => {
      const queryParams = this.queryParams();
      this.form.patchValue({
        email: queryParams?.['email'],
        password: queryParams?.['onetimePassword'],
        stayLoggedIn: queryParams?.['stayLoggedIn'],
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
