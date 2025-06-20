import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {MatChipGrid, MatChipInput, MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';

import {chipInputAdd, chipInputRemove} from '@app/util';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  template: `
    <div class="grid grid-cols-2 gap-4" [formGroup]="emailDataFormGroup">
      <mat-form-field class="col-span-2">
        <mat-label>{{ 'general.to' | transloco }}</mat-label>
        <mat-chip-grid
          #toGrid
          [attr.aria-label]="'notificationMethod.edit.email.to.enter' | transloco"
          formControlName="to">
          @for (email of emailDataFormGroup.controls.to.getRawValue(); track email) {
            <mat-chip-row (removed)="chipInputRemove(emailDataFormGroup.controls.to, email)">
              {{ email }}
              <button
                [attr.aria-label]="'notificationMethod.edit.email.to.remove' | transloco: {email}"
                type="button"
                matChipRemove>
                <bi name="x-circle" aria-hidden="true" />
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          [matChipInputFor]="toGrid"
          [placeholder]="'notificationMethod.edit.email.to.new' | transloco"
          (matChipInputTokenEnd)="chipInputAdd(emailDataFormGroup.controls.to, $event)" />

        @let toErrors = emailDataFormGroup.controls.to.errors;
        @if (toErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (toErrors?.['minLengthArrayItem']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (toErrors?.['maxLengthArrayItem']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      <div class="col-span-2 grid grid-cols-12 gap-4">
        <mat-form-field class="col-span-9">
          <mat-label>{{ 'general.host' | transloco }}</mat-label>
          <input matInput formControlName="host" />

          @let hostErrors = emailDataFormGroup.controls.host.errors;
          @if (hostErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (hostErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (hostErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
          @if (hostErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.domain' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="col-span-3">
          <mat-label>{{ 'general.port' | transloco }}</mat-label>
          <input matInput type="number" formControlName="port" step="1" />

          @let portErrors = emailDataFormGroup.controls.port.errors;
          @if (portErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (portErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (portErrors?.['max']; as max) {
            <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
          }
          @if (portErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>
      </div>

      <div class="col-span-2 mb-5 grid items-center gap-4 xl:grid-cols-6">
        <mat-form-field class="col-span-4" subscriptSizing="dynamic">
          <mat-label>{{ 'general.security' | transloco }}</mat-label>
          <mat-select formControlName="security">
            <mat-option value="NONE_STARTTLS">None / STARTTLS (25, 587)</mat-option>
            <mat-option value="TLS">TLS (465)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-slide-toggle class="col-span-2" formControlName="ignoreTLSErrors">
          {{ 'notificationMethod.edit.email.ignoreTLSErrors' | transloco }}
        </mat-slide-toggle>
      </div>

      <mat-form-field class="col-span-1">
        <mat-label>Username</mat-label>
        <input matInput formControlName="username" />
        @let usernameErrors = emailDataFormGroup.controls.username.errors;
        @if (usernameErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field class="col-span-1">
        <mat-label>Password</mat-label>
        <input matInput type="password" formControlName="password" />
        @let passwordErrors = emailDataFormGroup.controls.password.errors;
        @if (passwordErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field class="col-span-2">
        <mat-label>CC</mat-label>
        <mat-chip-grid
          #ccGrid
          [attr.aria-label]="'notificationMethod.edit.email.cc.enter' | transloco"
          formControlName="cc">
          @for (email of emailDataFormGroup.controls.cc.getRawValue(); track email) {
            <mat-chip-row (removed)="chipInputRemove(emailDataFormGroup.controls.cc, email)">
              {{ email }}
              <button
                [attr.aria-label]="'notificationMethod.edit.email.cc.remove' | transloco: {email}"
                type="button"
                matChipRemove>
                <bi name="x-circle" aria-hidden="true" />
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          [matChipInputFor]="ccGrid"
          [placeholder]="'notificationMethod.edit.email.cc.new' | transloco"
          (matChipInputTokenEnd)="chipInputAdd(emailDataFormGroup.controls.cc, $event)" />

        @let ccErrors = emailDataFormGroup.controls.cc.errors;
        @if (ccErrors?.['minLengthArrayItem']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (ccErrors?.['maxLengthArrayItem']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field class="col-span-2">
        <mat-label>BCC</mat-label>
        <mat-chip-grid
          #bccGrid
          [attr.aria-label]="'notificationMethod.edit.email.bcc.enter' | transloco"
          formControlName="bcc">
          @for (email of emailDataFormGroup.controls.bcc.getRawValue(); track email) {
            <mat-chip-row (removed)="chipInputRemove(emailDataFormGroup.controls.bcc, email)">
              {{ email }}
              <button
                [attr.aria-label]="'notificationMethod.edit.email.bcc.remove' | transloco: {email}"
                type="button"
                matChipRemove>
                <bi name="x-circle" aria-hidden="true" />
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          [matChipInputFor]="bccGrid"
          [placeholder]="'notificationMethod.edit.email.bcc.new' | transloco"
          (matChipInputTokenEnd)="chipInputAdd(emailDataFormGroup.controls.bcc, $event)" />

        @let bccErrors = emailDataFormGroup.controls.bcc.errors;
        @if (bccErrors?.['minLengthArrayItem']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (bccErrors?.['maxLengthArrayItem']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
      </mat-form-field>
    </div>
  `,
  selector: 'pu-notification-method-edit-form-email-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatChipInput,
    BiComponent,
    TranslocoPipe,
    MatSelect,
    MatOption,
    MatSlideToggle,
    MatError,
  ],
})
export class NotificationMethodEditFormEmailData {
  emailDataFormGroup = inject(NotificationMethodEditFormDataService).emailDataFormGroup;

  protected readonly chipInputAdd = chipInputAdd;
  protected readonly chipInputRemove = chipInputRemove;
}
