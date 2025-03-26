import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="grid gap-6" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field>
        <mat-label>{{ 'general.name' | transloco }}</mat-label>
        <input matInput formControlName="name" />

        @let nameErrors = form.controls.name.errors;
        @if (nameErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (nameErrors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (nameErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ 'general.emailAddress' | transloco }}</mat-label>
        <input matInput formControlName="email" />

        @let emailErrors = form.controls.email.errors;
        @if (emailErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (emailErrors?.['email']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (emailErrors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (emailErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      @let _isCreating = isCreating();

      <div class="grid pb-4">
        <mat-form-field>
          <mat-label>{{ 'general.password' | transloco }}</mat-label>
          <input matInput formControlName="password" placeholder="********" />

          @let passwordErrors = form.controls.password.errors;
          @if (passwordErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
        </mat-form-field>

        @if (!_isCreating) {
          <mat-slide-toggle formControlName="updatePassword">
            {{ 'user.edit.updatePassword' | transloco }}
          </mat-slide-toggle>
        }
      </div>

      <mat-slide-toggle formControlName="sendInvitation">
        {{ 'user.edit.sendInviteEmail' | transloco }}
      </mat-slide-toggle>

      <div class="flex flex-wrap gap-x-8 gap-y-6">
        <mat-slide-toggle formControlName="isAdmin">
          {{ 'general.systemAdmin' | transloco }}
        </mat-slide-toggle>

        @if (!_isCreating) {
          <mat-slide-toggle formControlName="activated">
            {{ 'general.activated' | transloco }}
          </mat-slide-toggle>
        }

        <mat-slide-toggle formControlName="forcePasswordChange">
          {{ 'user.edit.forcePasswordChange' | transloco }}
        </mat-slide-toggle>
      </div>

      <pu-save-button [valid]="valid" />
    </form>
  `,
  selector: 'pu-user-edit-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSlideToggle,
    TranslocoPipe,
    SaveButton,
    MatError,
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
    if ((!value.updatePassword || value.updatePassword === undefined) && !this.isCreating()) {
      value.password = undefined;
    }

    if (value.password === '') {
      value.password = undefined;
    }

    return super.overrideRawValue(value);
  }
}
