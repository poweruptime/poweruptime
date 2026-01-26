import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {MonitorEditFormDataCard} from './monitor-edit-form-data-card';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-ping-data',
  template: `
    <pu-monitor-edit-form-data-card type="PING">
      <div class="flex gap-4" [formGroup]="pingDataFormGroup">
        <hlm-form-field class="flex-1">
          <label hlmLabel for="ip">{{ 'general.ipAddress' | transloco }}</label>
          <input id="ip" hlmInput formControlName="ip" type="text" placeholder="1.1.1.1" />
          @let ipErrors = pingDataFormGroup.controls.ip.errors;
          @if (ipErrors?.['required']) {
            <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
          }
          @if (ipErrors?.['minlength']; as minlength) {
            <hlm-error>{{ 'form.validation.minlength' | transloco: minlength }}</hlm-error>
          }
          @if (ipErrors?.['maxlength']; as maxlength) {
            <hlm-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</hlm-error>
          }
          @if (ipErrors?.['pattern']) {
            <hlm-error>{{ 'form.validation.ipv4' | transloco }}</hlm-error>
          }
        </hlm-form-field>

        <hlm-form-field class="w-48">
          <label hlmLabel for="port">{{ 'general.port' | transloco }}</label>

          <input id="port" hlmInput formControlName="port" step="1" type="number" />

          @let portErrors = pingDataFormGroup.controls.port.errors;
          @if (portErrors?.['required']) {
            <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
          }
          @if (portErrors?.['min']; as min) {
            <hlm-error>{{ 'form.validation.min' | transloco: min }}</hlm-error>
          }
          @if (portErrors?.['max']; as max) {
            <hlm-error>{{ 'form.validation.max' | transloco: max }}</hlm-error>
          }
          @if (portErrors?.['pattern']) {
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
    HlmInputImports,
    HlmLabelImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormPingData {
  pingDataFormGroup = inject(MonitorEditFormDataService).pingDataFormGroup;
}
