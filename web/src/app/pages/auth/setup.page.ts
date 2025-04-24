import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatButton} from '@angular/material/button';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {TranslocoMarkupComponent} from 'ngx-transloco-markup';

import {Database} from '@app/api';
import {AlertDirective} from '@app/components';
import {injectIsValid} from '@app/form';
import {SetupStore} from '@app/services';

@Component({
  template: `
    @defer (on timer(50)) {
      <mat-card class="w-full">
        <mat-card-header>
          <mat-card-title>
            <span class="text-2xl">
              <strong>poweruptime</strong>
              | {{ 'auth.setup.title' | transloco }}
            </span>
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form class="mt-6 grid gap-4" [formGroup]="form" (ngSubmit)="submit()">
            @if (setupStore.error()) {
              <div puAlert type="WARN">Error while finishing setup... Already setup?</div>
            }

            <h3>{{ 'auth.setup.description' | transloco }}:</h3>
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

            <div puAlert type="INFO">
              <b>{{ 'auth.setup.info1' | transloco }}</b>
              <br />
              <br />
              <transloco
                [params]="{forgotPasswordUrl: '/auth/forgot-password'}"
                key="auth.setup.info2" />
            </div>

            <button [disabled]="!isValid()" mat-flat-button type="submit">
              <bi class="mr-2" name="envelope-plus" />
              {{ 'auth.setup.send' | transloco }}
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
    AlertDirective,
    TranslocoMarkupComponent,
  ],
})
export class SetupPage {
  readonly setupStore = inject(SetupStore);

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
    this.setupStore.setup(this.form.getRawValue());
  }
}
