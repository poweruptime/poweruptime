import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {MonitorEditFormDataCard} from './monitor-edit-form-data-card';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-ssl-certificate-data',
  template: `
    <pu-monitor-edit-form-data-card type="SSL_CERTIFICATE">
      <div class="flex gap-4" [formGroup]="sslCertificateDataFormGroup">
        <hlm-form-field class="flex-1">
          <label hlmLabel for="url">
            {{ 'general.url' | transloco }}
          </label>
          <input
            id="url"
            hlmInput
            formControlName="url"
            type="url"
            placeholder="https://google.com" />
          @let urlErrors = sslCertificateDataFormGroup.controls.url.errors;
          @if (urlErrors?.['required']) {
            <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
          }
          @if (urlErrors?.['minlength']; as minlength) {
            <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
          }
          @if (urlErrors?.['maxlength']; as maxlength) {
            <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
          }
          @if (urlErrors?.['pattern']) {
            <hlm-error>{{ 'form.validation.url' | transloco }}</hlm-error>
          }
        </hlm-form-field>

        <hlm-form-field class="w-64">
          <label hlmLabel for="validDaysLeft">
            {{ 'monitor.edit.ssl.validDaysLeft' | transloco }}
          </label>

          <input
            id="validDaysLeft"
            hlmInput
            formControlName="validDaysLeft"
            step="1"
            type="number" />

          <hlm-hint>Alert when certificate expires within this many days</hlm-hint>

          @let validDaysLeftErrors = sslCertificateDataFormGroup.controls.validDaysLeft.errors;
          @if (validDaysLeftErrors?.['min']; as min) {
            <hlm-error>{{ 'form.validation.min' | transloco: min }}</hlm-error>
          }
          @if (validDaysLeftErrors?.['max']; as max) {
            <hlm-error>{{ 'form.validation.max' | transloco: max }}</hlm-error>
          }
          @if (validDaysLeftErrors?.['pattern']) {
            <hlm-error>{{ 'form.validation.integer' | transloco }}</hlm-error>
          }
        </hlm-form-field>
      </div>
    </pu-monitor-edit-form-data-card>
  `,
  imports: [
    MonitorEditFormDataCard,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmFormFieldImports,
    HlmLabelImports,
    HlmInputImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormSSLCertificateData {
  sslCertificateDataFormGroup = inject(MonitorEditFormDataService).sslCertificateDataFormGroup;
}
