import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';

import {MentionAutocompleteTrigger} from '@app/components';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-http-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="httpDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field class="w-full">
          <mat-label>{{ 'general.url' | transloco }}</mat-label>
          <input matInput formControlName="url" />

          @let urlErrors = httpDataFormGroup.controls.url.errors;
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

        <mat-form-field class="w-48">
          <mat-label>{{ 'general.method' | transloco }}</mat-label>
          <mat-select formControlName="method">
            <mat-option value="GET">GET</mat-option>
            <mat-option value="POST">POST</mat-option>
            <mat-option value="PUT">PUT</mat-option>
            <mat-option value="PATCH">PATCH</mat-option>
            <mat-option value="DELETE">DELETE</mat-option>
            <mat-option value="HEAD">HEAD</mat-option>
            <mat-option value="OPTIONS">OPTIONS</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field class="w-64">
          <mat-label>{{ 'general.contentType' | transloco }}</mat-label>
          <mat-select formControlName="contentType">
            <mat-option value="JSON">JSON</mat-option>
            <mat-option value="XML">XML</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="flex gap-2">
        <mat-form-field class="w-52">
          <mat-label>{{ 'monitor.edit.http.authType' | transloco }}</mat-label>
          <mat-select formControlName="authType">
            <mat-option [value]="undefined">None</mat-option>
            <mat-option value="BASIC_AUTH">Basic auth</mat-option>
          </mat-select>
        </mat-form-field>

        @if (httpDataFormGroup.controls.authType.getRawValue() === 'BASIC_AUTH') {
          <div class="flex w-full gap-2">
            <mat-form-field class="w-full">
              <mat-label>{{ 'general.username' | transloco }}</mat-label>
              <input matInput formControlName="basicAuthDataUsername" />
              @let basicAuthUsernameErrors =
                httpDataFormGroup.controls.basicAuthDataUsername.errors;
              @if (basicAuthUsernameErrors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (basicAuthUsernameErrors?.['maxlength']; as maxlength) {
                <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field class="w-full">
              <mat-label>{{ 'general.password' | transloco }}</mat-label>
              <input matInput type="password" formControlName="basicAuthDataPassword" />
              @let basicAuthPasswordErrors =
                httpDataFormGroup.controls.basicAuthDataPassword.errors;
              @if (basicAuthPasswordErrors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (basicAuthPasswordErrors?.['maxlength']; as maxlength) {
                <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
              }
            </mat-form-field>
          </div>
        }
      </div>

      <mat-form-field>
        <mat-label>{{ 'monitor.edit.http.searchTerm' | transloco }}</mat-label>
        <textarea
          matInput
          formControlName="searchTerm"
          rows="3"
          cdkTextareaAutosize
          cdkAutosizeMinRows="3"></textarea>
      </mat-form-field>

      <mat-form-field>
        <mat-label>{{ 'general.body' | transloco }}</mat-label>
        <textarea
          matInput
          formControlName="body"
          rows="3"
          cdkTextareaAutosize
          cdkAutosizeMinRows="3"></textarea>
      </mat-form-field>

      <mat-slide-toggle formControlName="ignoreTLS">
        {{ 'monitor.edit.http.ignoreTLS' | transloco }}
      </mat-slide-toggle>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatOption,
    MatSlideToggle,
    TranslocoPipe,
    CdkTextareaAutosize,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormHttpData {
  httpDataFormGroup = inject(MonitorEditFormDataService).httpDataFormGroup;
}
