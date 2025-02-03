import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="flex flex-col gap-8" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <div class="flex">
        <div class="flex flex-col gap-5">
          <mat-form-field>
            <mat-label>{{ 'general.name' | transloco }}</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>

          <mat-form-field>
            <mat-label>{{ 'general.email' | transloco }}</mat-label>
            <input matInput formControlName="email" />
          </mat-form-field>

          @let _isCreating = isCreating();

          <div class="flex flex-col pb-4">
            <mat-form-field>
              <mat-label>{{ 'Password' | transloco }}</mat-label>
              <input matInput formControlName="password" placeholder="********" />
            </mat-form-field>

            @if (!_isCreating) {
              <mat-slide-toggle formControlName="updatePassword">Update password</mat-slide-toggle>
            }
          </div>

          <mat-slide-toggle formControlName="sendInvitation">Send invite mail</mat-slide-toggle>

          <div class="flex gap-8">
            <mat-slide-toggle formControlName="isAdmin">System-Admin</mat-slide-toggle>

            @if (!_isCreating) {
              <mat-slide-toggle formControlName="activated">Activated</mat-slide-toggle>
            }

            <mat-slide-toggle formControlName="forcePasswordChange">
              Force password change on next login
            </mat-slide-toggle>
          </div>
        </div>
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
    password: [undefined as string | undefined],
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
