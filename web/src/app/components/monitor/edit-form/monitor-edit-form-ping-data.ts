import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';

import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-ping-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="pingDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field class="w-full">
          <mat-label>{{ 'general.ipAddress' | transloco }}</mat-label>
          <input matInput formControlName="ip" />
          @let ipErrors = pingDataFormGroup.controls.ip.errors;
          @if (ipErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (ipErrors?.['minlength']; as minlength) {
            <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
          }
          @if (ipErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
          @if (ipErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.ipv4' | transloco }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="w-48">
          <mat-label>{{ 'general.port' | transloco }}</mat-label>
          <input matInput type="number" formControlName="port" />

          @let portErrors = pingDataFormGroup.controls.port.errors;
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
    </div>
  `,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatError, MatLabel, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormPingData {
  pingDataFormGroup = inject(MonitorEditFormDataService).pingDataFormGroup;
}
