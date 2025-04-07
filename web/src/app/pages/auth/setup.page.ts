import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {Database} from '@app/api';
import {injectIsValid} from '@app/form';
import {AuthStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <mat-card class="w-full">
        <mat-card-header>
          <mat-card-title>
            <strong>poweruptime</strong>
            | {{ 'auth.setup' | transloco }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
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

            <button [disabled]="!isValid()" mat-flat-button type="submit">
              <bi class="mr-2" name="box-arrow-in-right" />
              {{ 'auth.login' | transloco }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  selector: 'pu-setup-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    BiComponent,
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
  ],
})
export class SetupPage {
  authStore = inject(AuthStore);

  form = inject(NonNullableFormBuilder).group({
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
  isValid = injectIsValid(this.form);

  submit(): void {
    this.authStore.setup(this.form.getRawValue());
  }
}
