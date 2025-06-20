import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid, notEqual} from '@app/form';

@Component({
  template: `
    @let valid = isValid();

    <form class="flex flex-col" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <span class="mb-4">{{ 'profile.email.current' | transloco }}: {{ email() }}</span>

      <mat-form-field>
        <mat-label>{{ 'profile.email.new' | transloco }}</mat-label>
        <input type="email" matInput formControlName="email" />

        @let emailErrors = form.controls.email.errors;
        @if (emailErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (emailErrors?.['email']) {
          <mat-error>{{ 'form.validation.email' | transloco }}</mat-error>
        }
        @if (emailErrors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (emailErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ 'general.password' | transloco }}</mat-label>
        <input matInput formControlName="password" type="password" />

        @let passwordErrors = form.controls.password.errors;
        @if (passwordErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (passwordErrors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
      </mat-form-field>

      <pu-save-button [valid]="valid" [text]="'profile.email.requestChange' | transloco" />
    </form>
  `,
  selector: 'pu-profile-email-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    SaveButton,
    TranslocoPipe,
  ],
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
