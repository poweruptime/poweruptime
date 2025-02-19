import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-ssl-certificate-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="sslCertificateDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>{{ 'general.url' | transloco }}</mat-label>
          <input matInput formControlName="url" />

          @let urlErrors = sslCertificateDataFormGroup.controls.url.errors;
          @if (urlErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (urlErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (urlErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
          @if (urlErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.url' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>{{ 'monitor.edit.ssl.validDaysLeft' | transloco }}</mat-label>
          <input matInput type="number" step="1" formControlName="validDaysLeft" />

          @let validDaysLeftErrors = sslCertificateDataFormGroup.controls.validDaysLeft.errors;
          @if (validDaysLeftErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (validDaysLeftErrors?.['max']; as max) {
            <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
          }
          @if (validDaysLeftErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>
      </div>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatError,
    MatLabel,
    TranslocoPipe,
    MatError,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormSSLCertificateData {
  sslCertificateDataFormGroup = inject(MonitorEditFormDataService).sslCertificateDataFormGroup;
}
