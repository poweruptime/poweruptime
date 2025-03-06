import {ChangeDetectionStrategy, Component} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form class="flex flex-col gap-2" id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <mat-form-field>
        <mat-label>{{ 'general.emailAddress' | transloco }}</mat-label>
        <input matInput formControlName="email" />

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
        <mat-label>{{ 'general.role' | transloco }}</mat-label>
        <mat-select formControlName="role">
          <mat-option value="ADMIN">{{ 'general.admin' | transloco }}</mat-option>
          <mat-option value="MEMBER">{{ 'general.member' | transloco }}</mat-option>
        </mat-select>
      </mat-form-field>

      <pu-save-button [valid]="isValid()" />
    </form>
  `,
  selector: 'pu-team-user-invite-form',
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatOption,
    SaveButton,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamUserInviteForm extends AbstractModelEditFormComponent<
  BackendType['InviteTeamUserDto'],
  BackendType['InviteTeamUserDto']
> {
  override form = this.fb.nonNullable.group({
    role: ['', [Validators.required]],
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
}
