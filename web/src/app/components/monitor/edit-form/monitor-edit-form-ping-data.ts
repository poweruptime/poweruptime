import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFieldImports} from '@spartan-ng/helm/field';
import {HlmInputImports} from '@spartan-ng/helm/input';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  template: `
    <div class="flex gap-4" [formGroup]="pingDataFormGroup">
      <hlm-field class="flex-1">
        <label hlmFieldLabel for="ip">{{ 'general.ipAddress' | transloco }}</label>
        <input id="ip" hlmInput formControlName="ip" type="text" placeholder="1.1.1.1" />
        @let ipErrors = pingDataFormGroup.controls.ip.errors;
        @if (ipErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (ipErrors?.['minlength']; as minlength) {
          <hlm-field-error>
            {{ 'form.validation.minlength' | transloco: minlength }}
          </hlm-field-error>
        }
        @if (ipErrors?.['maxlength']; as maxlength) {
          <hlm-field-error>
            {{ 'form.validation.maxlength' | transloco: maxlength }}
          </hlm-field-error>
        }
        @if (ipErrors?.['pattern']) {
          <hlm-field-error>{{ 'form.validation.ipv4' | transloco }}</hlm-field-error>
        }
      </hlm-field>

      <hlm-field class="w-48">
        <label hlmFieldLabel for="port">{{ 'general.port' | transloco }}</label>

        <input id="port" hlmInput formControlName="port" step="1" type="number" />

        @let portErrors = pingDataFormGroup.controls.port.errors;
        @if (portErrors?.['required']) {
          <hlm-field-error>{{ 'form.validation.required' | transloco }}</hlm-field-error>
        }
        @if (portErrors?.['min']; as min) {
          <hlm-field-error>{{ 'form.validation.min' | transloco: min }}</hlm-field-error>
        }
        @if (portErrors?.['max']; as max) {
          <hlm-field-error>{{ 'form.validation.max' | transloco: max }}</hlm-field-error>
        }
        @if (portErrors?.['pattern']) {
          <hlm-field-error>{{ 'form.validation.integer' | transloco }}</hlm-field-error>
        }
      </hlm-field>
    </div>
  `,
  selector: 'pu-monitor-edit-form-ping-data',
  imports: [ReactiveFormsModule, TranslocoPipe, HlmInputImports, HlmFieldImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormPingData {
  pingDataFormGroup = inject(MonitorEditFormDataService).pingDataFormGroup;
}
