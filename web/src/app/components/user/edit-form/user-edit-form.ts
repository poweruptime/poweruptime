import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmBadgeImports} from '@spartan-ng/helm/badge';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import {BackendType, Database} from '@app/api';
import {
  AbstractModelEditFormComponent,
  PasswordShowButton,
  SaveButton,
  injectIsValid,
} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form
      class="grid gap-6 pb-4 md:grid-cols-2"
      id="form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()">
      <hlm-form-field>
        <label hlmLabel for="name">
          {{ 'general.name' | transloco }}
        </label>

        <div hlmInputGroup>
          <input id="name" hlmInputGroupInput formControlName="name" type="text" />
          <div hlmInputGroupAddon>
            <ng-icon name="lucideUser" />
          </div>
        </div>
        @let nameErrors = form.controls.name.errors;
        @if (nameErrors?.['required']) {
          <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
        }
        @if (nameErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (nameErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
      </hlm-form-field>
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
        @if (emailErrors?.['minlength']; as minlength) {
          <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
        }
        @if (emailErrors?.['maxlength']; as maxlength) {
          <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
        }
      </hlm-form-field>

      @let _isCreating = isCreating();

      @if (!_isCreating) {
        <div
          class="border-input data-[checked=true]:border-primary/50 relative grid gap-4 rounded-md border p-4 shadow-xs outline-none"
          [attr.data-checked]="form.controls.updatePassword.value">
          <label
            class="flex items-start justify-between gap-2 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
            for="updatedPassword"
            hlmLabel>
            <div class="inline-flex items-center gap-2">
              <div class="bg-secondary flex h-9 w-9 items-center justify-center rounded-md">
                <ng-icon hlm size="sm" name="lucideRefreshCcw" />
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-sm leading-4">{{ 'user.edit.updatePassword' | transloco }}</span>
                <p class="text-muted-foreground text-xs font-normal">
                  Set a new password for this user
                </p>
              </div>
            </div>
            <hlm-switch id="updatedPassword" formControlName="updatePassword" />
          </label>

          @if (form.controls.updatePassword.value) {
            <hlm-form-field>
              <label hlmLabel for="password">
                {{ 'general.password' | transloco }}
              </label>

              <div hlmInputGroup>
                <input
                  id="password"
                  [type]="showPasswordButton.type()"
                  [placeholder]="showPasswordButton.placeholder()"
                  hlmInputGroupInput
                  formControlName="password" />
                <div hlmInputGroupAddon>
                  <ng-icon name="lucideKey" />
                </div>
                <pu-password-show-button
                  #showPasswordButton
                  hlmInputGroupAddon
                  align="inline-end" />
              </div>
              @let passwordErrors = form.controls.password.errors;
              @if (passwordErrors?.['required']) {
                <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
              }
              @if (passwordErrors?.['minlength']; as minlength) {
                <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
              }
            </hlm-form-field>
          }
        </div>
      } @else {
        <hlm-form-field>
          <label hlmLabel for="password">
            {{ 'general.password' | transloco }}
          </label>

          <div hlmInputGroup>
            <input
              id="password"
              [type]="showPasswordButton.type()"
              [placeholder]="showPasswordButton.placeholder()"
              hlmInputGroupInput
              formControlName="password" />
            <div hlmInputGroupAddon>
              <ng-icon name="lucideKey" />
            </div>
            <pu-password-show-button #showPasswordButton hlmInputGroupAddon align="inline-end" />
          </div>
          @let passwordErrors = form.controls.password.errors;
          @if (passwordErrors?.['required']) {
            <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
          }
          @if (passwordErrors?.['minlength']; as minlength) {
            <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
          }
        </hlm-form-field>
      }

      <div>
        <div
          class="border-input data-[checked=true]:border-primary/50 relative w-full rounded-md border p-4 shadow-xs outline-none"
          [attr.data-checked]="form.controls.forcePasswordChange.value">
          <label
            class="flex items-start justify-between gap-2 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
            for="forcePasswordChange"
            hlmLabel>
            <div class="inline-flex items-center gap-2">
              <div class="bg-secondary flex h-9 w-9 items-center justify-center rounded-md">
                <ng-icon hlm size="sm" name="lucideAxe" />
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-sm leading-4">
                  {{ 'user.edit.forcePasswordChange' | transloco }}
                </span>
                <p class="text-muted-foreground text-xs font-normal">
                  Require user to set a new password on next login
                </p>
              </div>
            </div>
            <hlm-switch id="forcePasswordChange" formControlName="forcePasswordChange" />
          </label>
        </div>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        @let isAdmin = form.controls.isAdmin.value;
        <div
          class="border-input data-[checked=true]:border-primary/50 relative rounded-md border p-4 shadow-xs outline-none"
          [attr.data-checked]="isAdmin">
          <label
            class="flex items-start justify-between gap-2 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
            for="isAdmin"
            hlmLabel>
            <div class="flex flex-col gap-2">
              <div class="inline-flex items-center gap-2">
                <span class="text-sm leading-4">{{ 'general.systemAdmin' | transloco }}</span>
                @if (isAdmin) {
                  <span
                    class="bg-blue-500 text-white dark:bg-blue-600"
                    hlmBadge
                    variant="secondary">
                    Admin
                  </span>
                }
              </div>
              <p class="text-muted-foreground text-xs font-normal">
                Full administrative privileges
              </p>
            </div>
            <hlm-switch id="isAdmin" formControlName="isAdmin" />
          </label>
        </div>
        @if (!_isCreating) {
          @let isActivated = form.controls.activated.value;
          <div
            class="border-input data-[checked=true]:border-primary/50 relative rounded-md border p-4 shadow-xs outline-none"
            [attr.data-checked]="isActivated">
            <label
              class="flex items-start justify-between gap-2 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
              for="activated"
              hlmLabel>
              <div class="flex flex-col gap-2">
                <div class="inline-flex items-center gap-2">
                  <span class="text-sm leading-4">{{ 'general.activated' | transloco }}</span>
                  @if (isActivated) {
                    <span
                      class="bg-blue-500 text-white dark:bg-blue-600"
                      hlmBadge
                      variant="secondary">
                      Active
                    </span>
                  }
                </div>
                <p class="text-muted-foreground text-xs font-normal">User can access the system</p>
              </div>
              <hlm-switch id="activated" formControlName="activated" />
            </label>
          </div>
        }
      </div>

      <div>
        <div
          class="border-input data-[checked=true]:border-primary/50 relative w-full rounded-md border p-4 shadow-xs outline-none"
          [attr.data-checked]="form.controls.sendInvitation.value">
          <label
            class="flex items-start justify-between gap-2 has-data-[disabled=true]:cursor-not-allowed has-data-[disabled=true]:opacity-70"
            for="sendInvitation"
            hlmLabel>
            <div class="inline-flex items-center gap-2">
              <div class="bg-secondary flex h-9 w-9 items-center justify-center rounded-md">
                <ng-icon hlm size="sm" name="lucideMail" />
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-sm leading-4">{{ 'user.edit.sendInviteEmail' | transloco }}</span>
                <p class="text-muted-foreground text-xs font-normal">
                  Send account activation email
                </p>
              </div>
            </div>
            <hlm-switch id="sendInvitation" formControlName="sendInvitation" />
          </label>
        </div>
      </div>

      <pu-save-button [valid]="valid" />
    </form>
  `,
  selector: 'pu-user-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SaveButton,
    PasswordShowButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmSwitchImports,
    HlmLabelImports,
    HlmFormFieldImports,
    HlmInputGroupImports,
    HlmIconImports,
    HlmBadgeImports,
  ],
})
export class UserEditForm extends AbstractModelEditFormComponent<
  BackendType['CreateUserDto'],
  BackendType['UpdateUserDto']
> {
  override form = this.fb.nonNullable.group({
    id: [undefined as string | undefined],
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
    updatePassword: [false],
    password: [
      undefined as string | undefined,
      [Validators.minLength(Database.MIN_PASSWORD_LENGTH)],
    ],
    activated: [true, [Validators.required]],
    sendInvitation: [false, [Validators.required]],
    forcePasswordChange: [false, [Validators.required]],
    isAdmin: [false, [Validators.required]],
  });

  isValid = injectIsValid(this.form);

  user = input(undefined, {
    transform: (it: BackendType['UserResponse'] | undefined) => {
      this.isCreating.set(!it);
      if (!it) {
        this.form.controls.sendInvitation.setValue(true);
        this.form.controls.password.setValidators([
          Validators.minLength(Database.MIN_PASSWORD_LENGTH),
        ]);
        return undefined;
      }

      this.form.controls.password.disable();
      this.form.patchValue({
        ...it,
        isAdmin: it.role === 'ADMIN',
      });

      return it;
    },
  });

  lastForcePasswordChangeValue?: boolean;
  lastActivatedValue?: boolean;

  constructor() {
    super();

    this.form.controls.updatePassword.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => {
      if (value) {
        this.form.controls.password.enable();
      } else {
        this.form.controls.password.disable();
      }
    });

    this.form.controls.sendInvitation.valueChanges.pipe(takeUntilDestroyed()).subscribe((it) => {
      if (it) {
        this.lastForcePasswordChangeValue = this.form.controls.forcePasswordChange.getRawValue();
        this.form.controls.forcePasswordChange.disable();
        this.form.controls.forcePasswordChange.setValue(true);
        this.lastActivatedValue = this.form.controls.activated.getRawValue();
        this.form.controls.activated.disable();
        this.form.controls.activated.setValue(true);
        return;
      }

      this.form.controls.forcePasswordChange.setValue(this.lastForcePasswordChangeValue!);
      this.form.controls.forcePasswordChange.enable();
      this.form.controls.activated.setValue(this.lastActivatedValue!);
      this.form.controls.activated.enable();
    });
  }

  override reset(): void {
    super.reset();

    this.form.controls.password.enable();
  }

  override overrideRawValue(value: ReturnType<typeof this.form.getRawValue>): unknown {
    // @ts-expect-error role does not exist
    value.role = value.isAdmin ? 'ADMIN' : 'USER';
    if (!value.updatePassword && !this.isCreating()) {
      value.password = undefined;
    }

    if (value.password === '') {
      value.password = undefined;
    }

    return super.overrideRawValue(value);
  }
}
