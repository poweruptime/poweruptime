import {ChangeDetectionStrategy, Component, effect, inject, input} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {InputOTPComponent, REGEXP_ONLY_DIGITS} from '@ngxpert/input-otp';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {Database} from '../api';
import {AlertDirective} from '../components';
import {FakeDash, Slot} from '../components/otp';
import {injectIsValid} from '../form';
import {SetupStore} from '../services';

@Component({
  template: `
    @defer (on timer(50)) {
      <mat-card class="w-full">
        <mat-card-header>
          <mat-card-title>
            <span class="text-2xl">
              <strong>poweruptime</strong>
              | {{ 'auth.setup.title' | transloco }}
            </span>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="mt-6 grid gap-4">
            @if (setupStore.isPending()) {
              <mat-progress-bar mode="indeterminate" />
            }

            @if (setupStore.error()?.codeName === 'SETUP_COMPLETED') {
              <div puAlert type="WARN">Error while finishing setup... Already setup?</div>
            }

            @switch (setupStore.state()) {
              @case ('setupTestEmail') {
                <div puAlert type="INFO">
                  <strong>{{ 'general.info' | transloco }}!</strong>
                  {{ 'auth.setup.testEmail.info' | transloco }}
                </div>

                @if (setupStore.error()?.codeName === 'EMAIL_SEND_FAILED') {
                  <div puAlert type="WARN">
                    {{ 'auth.setup.testEmail.failed' | transloco }}
                    <br />
                    <br />
                    <span>Error message:</span>
                    @if (setupStore.error()?.message; as errorMessage) {
                      <div [innerHTML]="errorMessage"></div>
                    }
                  </div>
                }

                <form class="grid gap-4" [formGroup]="testEmailForm" (ngSubmit)="submitTestEmail()">
                  <mat-form-field>
                    <mat-label>{{ 'general.emailAddress' | transloco }}</mat-label>
                    <input matInput formControlName="email" />

                    @let emailErrors = testEmailForm.controls.email.errors;
                    @if (emailErrors?.['required']) {
                      <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                    }
                    @if (emailErrors?.['email']) {
                      <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                    }
                    @if (emailErrors?.['minlength']; as minlength) {
                      <mat-error>
                        {{ 'form.validation.minlength' | transloco: minlength }}
                      </mat-error>
                    }
                    @if (emailErrors?.['maxlength']; as maxlength) {
                      <mat-error>
                        {{ 'form.validation.maxlength' | transloco: maxlength }}
                      </mat-error>
                    }
                  </mat-form-field>

                  <button [disabled]="!isTestEmailFormValid()" mat-flat-button type="submit">
                    <ng-icon class="mr-2" name="bootstrapEnvelopePlus" />
                    {{ 'auth.setup.testEmail.send' | transloco }}
                  </button>
                </form>

                @if (setupStore.error()) {
                  <button
                    (click)="setupStore.setState('confirmTestEmail')"
                    type="button"
                    mat-stroked-button>
                    {{ 'auth.setup.skip' | transloco }}
                    <ng-icon class="ml-2" name="bootstrapArrowRight" />
                  </button>
                }
              }
              @case ('confirmTestEmail') {
                @if (setupStore.error()?.codeName === 'INVALID_CODE') {
                  <div puAlert type="WARN">
                    {{ 'auth.setup.confirmEmail.invalidCode' | transloco }}
                  </div>
                }

                <form
                  class="flex flex-col items-center gap-4"
                  [formGroup]="confirmEmailForm"
                  (ngSubmit)="submitConfirmEmail()">
                  <input-otp
                    #otp="inputOtp"
                    [maxLength]="6"
                    [pattern]="REGEXP_ONLY_DIGITS"
                    formControlName="code"
                    containerClass="group flex items-center has-disabled:opacity-30 pb-16">
                    <div class="flex">
                      @for (
                        slot of otp.slots().slice(0, 3);
                        track $index;
                        let first = $first;
                        let last = $last
                      ) {
                        <pu-otp-slot
                          [isActive]="slot.isActive"
                          [char]="slot.char"
                          [placeholderChar]="slot.placeholderChar"
                          [hasFakeCaret]="slot.hasFakeCaret"
                          [first]="first"
                          [last]="last" />
                      }
                    </div>
                    <pu-otp-fake-dash />
                    <div class="flex">
                      @for (
                        slot of otp.slots().slice(3, 6);
                        track $index + 3;
                        let last = $last;
                        let first = $first
                      ) {
                        <pu-otp-slot
                          [isActive]="slot.isActive"
                          [char]="slot.char"
                          [placeholderChar]="slot.placeholderChar"
                          [hasFakeCaret]="slot.hasFakeCaret"
                          [first]="first"
                          [last]="last" />
                      }
                    </div>
                  </input-otp>

                  <button
                    class="w-full"
                    [disabled]="!isConfirmEmailFormValid()"
                    mat-flat-button
                    type="submit">
                    <ng-icon class="mr-2" name="bootstrapSendCheck" />
                    {{ 'auth.setup.confirmEmail.verify' | transloco }}
                  </button>

                  @if (setupStore.error()) {
                    <div class="flex w-full gap-4">
                      <button
                        class="w-full"
                        (click)="submitTestEmail()"
                        mat-stroked-button
                        type="button">
                        <ng-icon class="mr-2" name="bootstrapEnvelopePlus" />
                        {{ 'auth.setup.confirmEmail.resend' | transloco }}
                      </button>
                      <button
                        class="error-button w-full"
                        (click)="setupStore.setState('setup')"
                        type="button"
                        mat-button>
                        {{ 'auth.setup.skip' | transloco }}
                        <ng-icon class="ml-2" name="bootstrapArrowRight" />
                      </button>
                    </div>
                  }
                </form>
              }
              @case ('setup') {
                <form class="grid gap-4" [formGroup]="setupForm" (ngSubmit)="submitSetup()">
                  <h3>{{ 'auth.setup.description' | transloco }}:</h3>
                  <mat-form-field>
                    <mat-label>{{ 'general.name' | transloco }}</mat-label>
                    <input matInput formControlName="name" />

                    @let nameErrors = setupForm.controls.name.errors;
                    @if (nameErrors?.['required']) {
                      <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                    }
                    @if (nameErrors?.['minlength']; as minlength) {
                      <mat-error>
                        {{ 'form.validation.minlength' | transloco: minlength }}
                      </mat-error>
                    }
                    @if (nameErrors?.['maxlength']; as maxlength) {
                      <mat-error>
                        {{ 'form.validation.maxlength' | transloco: maxlength }}
                      </mat-error>
                    }
                  </mat-form-field>

                  <mat-form-field>
                    <mat-label>{{ 'general.emailAddress' | transloco }}</mat-label>
                    <input matInput formControlName="email" />

                    @let emailErrors = setupForm.controls.email.errors;
                    @if (emailErrors?.['required']) {
                      <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                    }
                    @if (emailErrors?.['email']) {
                      <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
                    }
                    @if (emailErrors?.['minlength']; as minlength) {
                      <mat-error>
                        {{ 'form.validation.minlength' | transloco: minlength }}
                      </mat-error>
                    }
                    @if (emailErrors?.['maxlength']; as maxlength) {
                      <mat-error>
                        {{ 'form.validation.maxlength' | transloco: maxlength }}
                      </mat-error>
                    }
                  </mat-form-field>

                  <button [disabled]="!isSetupFormValid()" mat-flat-button type="submit">
                    <ng-icon class="mr-2" name="bootstrapEnvelopePlus" />
                    {{ 'auth.setup.sendInvitation' | transloco }}
                  </button>
                </form>
              }
              @case ('setupCompleted') {
                <div class="flex h-40 items-center justify-center">
                  <ng-icon
                    name="bootstrapCheckCircleFill"
                    size="64"
                    style="color: var(--mat-sys-primary)" />
                </div>

                <div puAlert type="INFO">
                  <b>{{ 'auth.setup.setupCompleted.info1' | transloco }}</b>
                  <br />
                  <br />
                  <!-- t(auth.setup.setupCompleted.info2) -->
                  <transloco
                    [params]="{forgotPasswordUrl: '/auth/forgot-password'}"
                    key="auth.setup.setupCompleted.info2" />
                </div>
              }
            }
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  selector: 'pu-setup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    NgIcon,
    MatLabel,
    MatFormField,
    MatInput,
    MatError,
    MatButton,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    TranslocoPipe,
    AlertDirective,
    TranslocoMarkupComponent,
    FakeDash,
    InputOTPComponent,
    Slot,
    MatProgressBar,
  ],
})
export class SetupPage {
  protected readonly REGEXP_ONLY_DIGITS = REGEXP_ONLY_DIGITS;

  private readonly fb = inject(NonNullableFormBuilder);
  readonly setupStore = inject(SetupStore);

  protected readonly email = input<string>();
  protected readonly code = input<string>();

  testEmailForm = this.fb.group({
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
  isTestEmailFormValid = injectIsValid(this.testEmailForm);

  submitTestEmail(): void {
    this.setupStore.testEmail(this.testEmailForm.getRawValue().email);
  }

  confirmEmailForm = this.fb.group({
    code: [
      '',
      [
        Validators.required,
        Validators.pattern(REGEXP_ONLY_DIGITS),
        Validators.minLength(6),
        Validators.maxLength(6),
      ],
    ],
  });
  isConfirmEmailFormValid = injectIsValid(this.confirmEmailForm);

  submitConfirmEmail(): void {
    this.setupStore.confirmEmail(this.confirmEmailForm.getRawValue().code);
  }

  setupForm = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(Database.MIN_NAME_LENGTH),
        Validators.maxLength(Database.MAX_NAME_LENGTH),
      ],
    ],
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
  isSetupFormValid = injectIsValid(this.setupForm);

  submitSetup(): void {
    this.setupStore.setup(this.setupForm.getRawValue());
  }
  constructor() {
    effect(() => {
      const email = this.email();
      const code = this.code();

      if (email && code) {
        this.confirmEmailForm.patchValue({
          code,
        });
        this.setupForm.patchValue({
          email,
        });
        this.setupStore.setState('confirmTestEmail');
        this.submitConfirmEmail();
      }
    });
  }
}
