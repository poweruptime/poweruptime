import {isPlatformBrowser} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {AuthStore, InfoStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <section hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle>
            <span class="font-bold">poweruptime</span>
            | {{ 'auth.login' | transloco }}
          </h3>
        </div>
        <form class="grid gap-4" [formGroup]="form" (ngSubmit)="submit()" hlmCardContent>
          <hlm-form-field>
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
            @let emailErrors = form.controls.email.errors;
            @if (emailErrors?.['required']) {
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (emailErrors?.['email']) {
              <hlm-error>{{ 'form.validation.email' | transloco }}</hlm-error>
            }
            @if (emailErrors?.['maxlength']; as maxlength) {
              <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
            }
          </hlm-form-field>
          <hlm-form-field>
            <div class="flex justify-between gap-4">
              <label hlmLabel for="password">
                {{ 'general.password' | transloco }}
              </label>
              <a hlmBtn routerLink="/auth/forgot-password" variant="link">
                {{ 'auth.forgotPassword.title' | transloco }}
              </a>
            </div>

            <div hlmInputGroup>
              <input
                id="password"
                hlmInputGroupInput
                formControlName="password"
                type="password"
                placeholder="********" />
              <div hlmInputGroupAddon>
                <ng-icon name="lucideKey" />
              </div>
            </div>
            @let passwordErrors = form.controls.password.errors;
            @if (passwordErrors?.['required']) {
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (passwordErrors?.['minlength']; as minlength) {
              <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
            }
          </hlm-form-field>

          @if (authStore.error() === 'INVALID_CREDENTIALS') {
            <hlm-error>{{ 'auth.invalidCredentials' | transloco }}</hlm-error>
          }

          <label class="flex items-center" hlmLabel for="stayLoggedIn">
            <hlm-switch class="mr-2" id="stayLoggedIn" formControlName="stayLoggedIn" />
            {{ 'auth.stayLoggedIn' | transloco }}
          </label>

          <button [disabled]="!isValid()" hlmBtn type="submit">
            <ng-icon hlm size="sm" name="bootstrapBoxArrowInRight" />
            {{ 'auth.login' | transloco }}
          </button>

          @if (enabledOAuth2Providers().length > 0) {
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
                    hlmBtn
                    variant="outline">
                    <div class="inline-flex items-center gap-2">
                      @switch (provider.registrationId) {
                        @case ('google') {
                          <ng-icon hlm size="sm" name="bootstrapGoogle" />
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
          }
        </form>
      </section>
    }
  `,
  selector: 'login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    RouterLink,
    HlmCardImports,
    HlmLabelImports,
    HlmInputGroupImports,
    HlmFormFieldImports,
    HlmButtonImports,
    HlmSwitchImports,
    HlmIconImports,
  ],
})
export class LoginPage {
  private readonly infoStore = inject(InfoStore);

  protected readonly authStore = inject(AuthStore);

  protected readonly enabledOAuth2Providers = computed(
    () =>
      this.infoStore
        .oauth2Providers()
        ?.sort((a, b) => a.clientName.toLowerCase().localeCompare(b.clientName.toLowerCase())) ??
      [],
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
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

  protected readonly email = input<string>();
  protected readonly onetimePassword = input<string>();
  protected readonly stayLoggedIn = input(false, {transform: booleanAttribute});

  constructor() {
    this.infoStore.loadOAuth2Providers();

    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    effect(() => {
      this.form.patchValue({
        email: this.email(),
        password: this.onetimePassword(),
        stayLoggedIn: this.stayLoggedIn(),
      });

      if (isBrowser && this.form.valid) {
        this.submit();
      }
    });
  }

  submit(): void {
    this.authStore.login(this.form.getRawValue());
  }
}
