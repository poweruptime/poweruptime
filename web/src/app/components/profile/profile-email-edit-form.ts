import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid, notEqual} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="flex flex-col" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <span class="mb-4">Current email address: {{ email() }}</span>

      <mat-form-field>
        <mat-label>New email address</mat-label>
        <input type="email" matInput formControlName="email" />
      </mat-form-field>

      <mat-form-field>
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" type="password" />
      </mat-form-field>

      <!-- @jsverse/transloco -->
      <!-- t(profile.email.requestChange) -->
      <pu-save-button [valid]="valid" text="profile.email.requestChange" />
    </form>
  `,
  selector: 'pu-profile-email-form',
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel, SaveButton],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEmailEditForm extends AbstractModelEditFormComponent<
  BackendType['UpdateEmailDto'],
  BackendType['UpdateEmailDto']
> {
  override form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(Database.MIN_PASSWORD_LENGTH)]],
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

  isValid = injectIsValid(this.form);

  email = input(undefined, {
    transform: (email: string | undefined) => {
      if (!email) {
        return undefined;
      }

      this.form.controls.email.addValidators([notEqual(email)]);

      return email;
    },
  });

  override overrideRawValue(it: unknown): unknown {
    this.reset();
    return it;
  }
}
