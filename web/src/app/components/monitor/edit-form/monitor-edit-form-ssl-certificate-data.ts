import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="flex gap-4" [formGroup]="sslCertificateDataFormGroup">
      <hlm-field class="flex-1">
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
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (urlErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (urlErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
        @if (urlErrors?.['pattern']) {
          <hlm-field-error>{{ 'form.validation.url' | transloco }}</hlm-field-error>
        }
      </hlm-field>

      <hlm-field class="w-64">
        <label hlmLabel for="validDaysLeft">
          {{ 'monitor.edit.ssl.validDaysLeft' | transloco }}
        </label>

        <input id="validDaysLeft" hlmInput formControlName="validDaysLeft" step="1" type="number" />

        <p hlmFieldDescription>Alert when certificate expires within this many days</p>

        @let validDaysLeftErrors = sslCertificateDataFormGroup.controls.validDaysLeft.errors;
        @if (validDaysLeftErrors?.['min']; as min) {
          <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
        }
        @if (validDaysLeftErrors?.['max']; as max) {
          <hlm-field-error>{{ 'form.validation.max' | transloco: max }}</hlm-field-error>
        }
        @if (validDaysLeftErrors?.['pattern']) {
          <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
        }
      </hlm-field>
    </div>
  `,
  selector: 'pu-monitor-edit-form-ssl-certificate-data',
  imports: [ReactiveFormsModule, TranslocoPipe, HlmLabelImports, HlmInputImports, HlmFieldImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormSSLCertificateData {
  sslCertificateDataFormGroup = inject(MonitorEditFormDataService).sslCertificateDataFormGroup;
}
