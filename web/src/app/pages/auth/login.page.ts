import {ChangeDetectionStrategy, Component, computed, effect, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {injectQueryParams} from 'ngxtension/inject-query-params';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {AuthStore, JsonStore} from '@app/services';

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

            <div class="mt-6 flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <hr class="w-full" />
                <span class="whitespace-nowrap">{{ 'auth.oauth2Login' | transloco }}</span>
                <hr class="w-full" />
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                @for (provider of enabledOAuth2Providers(); track provider.registrationId) {
                  <a
                    [href]="'/api/oauth2/authorization/' + provider.registrationId"
                    mat-stroked-button>
                    <div class="inline-flex items-center gap-2">
                      @switch (provider.registrationId) {
                        @case ('google') {
                          <bi name="google" />
                        }
                        @case ('keycloak') {
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="m18.742 1.182l-12.493.002C4.155 4.784 2.079 8.393 0 12.002c2.071 3.612 4.162 7.214 6.252 10.816l12.49-.004l3.089-5.404h2.158v-.002H24L23.996 6.59h-2.168zM8.327 4.792h2.081l1.04 1.8l-3.12 5.413l3.117 5.403l-1.035 1.81H8.327a2048 2048 0 0 0-4.168-7.204zm6.241 0l2.086.003q2.088 3.608 4.166 7.222l-4.167 7.2h-2.08c-.382-.562-1.038-1.808-1.038-1.808l3.123-5.405l-3.124-5.413z" />
                          </svg>
                        }
                      }
                      {{ provider.clientName }}
                    </div>
                  </a>
                }
              </div>
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
    TranslocoPipe,
    RouterLink,
  ],
})
export class LoginPage {
  readonly authStore = inject(AuthStore);
  private readonly json = inject(JsonStore).json;

  readonly enabledOAuth2Providers = computed(
    () =>
      this.json()?.enabledOAuth2Providers?.sort((a, b) =>
        a.clientName.toLowerCase().localeCompare(b.clientName.toLowerCase()),
      ) ?? [],
  );

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
