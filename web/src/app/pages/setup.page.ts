import {ChangeDetectionStrategy, Component, effect, inject, input} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnInputOtpImports} from '@spartan-ng/brain/input-otp';
import {HlmAlertImports} from '@spartan-ng/helm/alert';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmInputOtpImports} from '@spartan-ng/helm/input-otp';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmProgressImports} from '@spartan-ng/helm/progress';
import {TranslocoMarkupComponent} from 'dfx-transloco-markup';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {SetupStore} from '@app/services';
import {HlmFieldImports} from '@spartan-ng/helm/field';

@Component({
  template: `
    @defer (on timer(50)) {
      <section hlmCard>
        <div hlmCardHeader>
          <h3 class="text-2xl" hlmCardTitle>
            <span class="font-bold" id="title">poweruptime</span>
            | {{ 'auth.setup.title' | transloco }}
          </h3>
        </div>
        <div class="grid gap-10" hlmCardContent>
          @if (setupStore.isPending()) {
            <hlm-progress>
              <hlm-progress-indicator />
            </hlm-progress>
          }

          <div class="grid gap-4">
            @if (setupStore.error()?.codeName === 'SETUP_COMPLETED') {
              <div hlmAlert variant="destructive">
                <ng-icon hlm hlmAlertIcon name="lucideCircleAlert" />
                <h4 hlmAlertTitle>Error while finishing setup... Already setup?</h4>
              </div>
            }

            @switch (setupStore.state()) {
              @case ('setupTestEmail') {
                <div hlmAlert>
                  <h4 hlmAlertTitle>{{ 'general.info' | transloco }}!</h4>
                  <p hlmAlertDescription>{{ 'auth.setup.testEmail.info' | transloco }}</p>
                </div>

                @if (setupStore.error()?.codeName === 'EMAIL_SEND_FAILED') {
                  <div hlmAlert variant="destructive">
                    <ng-icon hlm hlmAlertIcon name="lucideCircleAlert" />
                    <h4 hlmAlertTitle>{{ 'auth.setup.testEmail.failed' | transloco }}</h4>
                    <div hlmAlertDescription>
                      <br />
                      <span>Error message:</span>
                      @if (setupStore.error()?.message; as errorMessage) {
                        <div [innerHTML]="errorMessage"></div>
                      }
                    </div>
                  </div>
                }
              }
              @case ('confirmTestEmail') {
                @if (setupStore.error()?.codeName === 'INVALID_CODE') {
                  <div hlmAlert variant="destructive">
                    <ng-icon hlm hlmAlertIcon name="lucideCircleAlert" />
                    <h4 hlmAlertTitle>{{ 'auth.setup.confirmEmail.invalidCode' | transloco }}</h4>
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
                <hlm-field>
                  <label hlmLabel for="test-email">
                    {{ 'general.emailAddress' | transloco }}
                  </label>
                  <div hlmInputGroup>
                    <input
                      id="test-email"
                      hlmInputGroupInput
                      formControlName="email"
                      type="email"
                      placeholder="you@example.com" />
                    <div hlmInputGroupAddon>
                      <ng-icon name="lucideMail" />
                    </div>
                  </div>
                  @let testEmailErrors = testEmailForm.controls.email.errors;
                  @if (testEmailErrors?.['required']) {
                    <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                  }
                  @if (testEmailErrors?.['email']) {
                    <hlm-field-error>{{ 'form.validation.email' | transloco }}</hlm-field-error>
                  }
                  @if (testEmailErrors?.['minlength']; as minlength) {
                    <hlm-field-error>
                      {{ 'form.validation.minlength' | transloco: minlength }}
                    </hlm-field-error>
                  }
                  @if (testEmailErrors?.['maxlength']; as maxlength) {
                    <hlm-field-error>
                      {{ 'form.validation.maxlength' | transloco: maxlength }}
                    </hlm-field-error>
                  }
                </hlm-field>

                <div class="grid gap-4">
                  <button
                    id="email-test-button"
                    [disabled]="!isTestEmailFormValid()"
                    hlmBtn
                    type="submit">
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
                  id="email-test-code-input"
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
                    id="email-test-code-button"
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
                <hlm-field>
                  <label hlmLabel for="name">
                    {{ 'general.name' | transloco }}
                  </label>
                  <div hlmInputGroup>
                    <input
                      id="name"
                      hlmInputGroupInput
                      formControlName="name"
                      type="text"
                      placeholder="John Doe" />
                    <div hlmInputGroupAddon>
                      <ng-icon name="lucideUser" />
                    </div>
                  </div>
                  @let nameErrors = setupForm.controls.name.errors;
                  @if (nameErrors?.['required']) {
                    <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                  }
                  @if (nameErrors?.['minlength']; as minlength) {
                    <hlm-field-error>
                      {{ 'form.validation.minlength' | transloco: minlength }}
                    </hlm-field-error>
                  }
                  @if (nameErrors?.['maxlength']; as maxlength) {
                    <hlm-field-error>
                      {{ 'form.validation.maxlength' | transloco: maxlength }}
                    </hlm-field-error>
                  }
                </hlm-field>

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
                  @let setupEmailErrors = setupForm.controls.email.errors;
                  @if (setupEmailErrors?.['required']) {
                    <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
                  }
                  @if (setupEmailErrors?.['email']) {
                    <hlm-field-error>{{ 'form.validation.email' | transloco }}</hlm-field-error>
                  }
                  @if (setupEmailErrors?.['minlength']; as minlength) {
                    <hlm-field-error>
                      {{ 'form.validation.minlength' | transloco: minlength }}
                    </hlm-field-error>
                  }
                  @if (setupEmailErrors?.['maxlength']; as maxlength) {
                    <hlm-field-error>
                      {{ 'form.validation.maxlength' | transloco: maxlength }}
                    </hlm-field-error>
                  }
                </hlm-field>

                <button
                  id="send-invite-button"
                  [disabled]="!isSetupFormValid()"
                  hlmBtn
                  type="submit">
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

              <div hlmAlert>
                <ng-icon hlm hlmAlertIcon name="lucideCircleCheck" />
                <h4 hlmAlertTitle>{{ 'auth.setup.setupCompleted.info1' | transloco }}</h4>
                <p hlmAlertDescription>
                  <!-- t(auth.setup.setupCompleted.info2) -->
                  <transloco
                    [params]="{forgotPasswordUrl: '/auth/forgot-password'}"
                    key="auth.setup.setupCompleted.info2" />
                </p>
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
    TranslocoPipe,
    TranslocoMarkupComponent,
    HlmInputOtpImports,
    BrnInputOtpImports,
    HlmCardImports,
    HlmButtonImports,
    HlmIconImports,
    HlmInputGroupImports,
    HlmLabelImports,
    HlmAlertImports,
    HlmProgressImports,
    HlmFieldImports,
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
