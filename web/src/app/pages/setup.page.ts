import {ChangeDetectionStrategy, Component, effect, inject, input} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatProgressBar} from '@angular/material/progress-bar';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnInputOtpImports} from '@spartan-ng/brain/input-otp';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputOtpImports} from '@spartan-ng/helm/input-otp';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {Database} from '@app/api';
import {AlertDirective} from '@app/components';
import {injectIsValid} from '@app/form';
import {SetupStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <section hlmCard>
        <div hlmCardHeader>
          <h3 class="text-2xl" hlmCardTitle>
            <strong>poweruptime</strong>
            | {{ 'auth.setup.title' | transloco }}
          </h3>
        </div>
        <div class="grid gap-10" hlmCardContent>
          @if (setupStore.isPending()) {
            <mat-progress-bar mode="indeterminate" />
          }

          <div class="grid gap-4">
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
              }
              @case ('confirmTestEmail') {
                @if (setupStore.error()?.codeName === 'INVALID_CODE') {
                  <div puAlert type="WARN">
                    {{ 'auth.setup.confirmEmail.invalidCode' | transloco }}
                  </div>
                }
              }
            }
          </div>

          @switch (setupStore.state()) {
            @case ('setupTestEmail') {
              <form
                class="animate-in fade-in zoom-in slide-out-to-end-20 grid gap-6"
                [formGroup]="testEmailForm"
                (ngSubmit)="submitTestEmail()">
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

                <div class="grid gap-4">
                  <button [disabled]="!isTestEmailFormValid()" hlmBtn type="submit">
                    <ng-icon hlm size="sm" name="bootstrapEnvelopePlus" />
                    {{ 'auth.setup.testEmail.send' | transloco }}
                  </button>

                  @if (setupStore.error()) {
                    <button
                      (click)="setupStore.setState('confirmTestEmail')"
                      type="button"
                      hlmBtn
                      variant="outline">
                      {{ 'auth.setup.skip' | transloco }}
                      <ng-icon class="ml-2" name="bootstrapArrowRight" />
                    </button>
                  }
                </div>
              </form>
            }
            @case ('confirmTestEmail') {
              <form
                class="animate-in slide-in-from-start-20 slide-out-to-end-20 flex flex-col items-center gap-6"
                [formGroup]="confirmEmailForm"
                (ngSubmit)="submitConfirmEmail()">
                <brn-input-otp
                  hlmInputOtp
                  maxLength="6"
                  formControlName="code"
                  inputClass="disabled:cursor-not-allowed">
                  <div hlmInputOtpGroup>
                    <hlm-input-otp-slot index="0" />
                    <hlm-input-otp-slot index="1" />
                    <hlm-input-otp-slot index="2" />
                  </div>
                  <hlm-input-otp-separator />
                  <div hlmInputOtpGroup>
                    <hlm-input-otp-slot index="3" />
                    <hlm-input-otp-slot index="4" />
                    <hlm-input-otp-slot index="5" />
                  </div>
                </brn-input-otp>

                <div class="grid w-full gap-4 md:grid-cols-2">
                  <button
                    class="col-span-2"
                    [disabled]="!isConfirmEmailFormValid()"
                    hlmBtn
                    type="submit">
                    <ng-icon hlm size="sm" name="bootstrapSendCheck" />
                    {{ 'auth.setup.confirmEmail.verify' | transloco }}
                  </button>

                  @if (setupStore.error()) {
                    <button (click)="submitTestEmail()" hlmBtn variant="outline" type="button">
                      <ng-icon hlm size="sm" name="bootstrapEnvelopePlus" />
                      {{ 'auth.setup.confirmEmail.resend' | transloco }}
                    </button>
                    <button
                      (click)="setupStore.setState('setup')"
                      type="button"
                      hlmBtn
                      variant="ghost">
                      {{ 'auth.setup.skip' | transloco }}
                      <ng-icon hlm size="sm" name="bootstrapArrowRight" />
                    </button>
                  }
                </div>
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

                <button [disabled]="!isSetupFormValid()" hlmBtn type="submit">
                  <ng-icon hlm size="sm" name="bootstrapEnvelopePlus" />
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
      </section>
    }
  `,
  selector: 'pu-setup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatLabel,
    MatFormField,
    MatInput,
    MatError,
    TranslocoPipe,
    AlertDirective,
    TranslocoMarkupComponent,
    MatProgressBar,
    HlmInputOtpImports,
    BrnInputOtpImports,
    HlmCardImports,
    HlmButtonImports,
    HlmIconImports,
  ],
})
export class SetupPage {
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
        Validators.pattern(Database.INTEGER_REGEX),
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
