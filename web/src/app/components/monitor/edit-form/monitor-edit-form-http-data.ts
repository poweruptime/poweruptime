import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-http-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="httpDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>URL</mat-label>
          <input matInput formControlName="url" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Method</mat-label>
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

        <mat-form-field>
          <mat-label>Content type</mat-label>
          <mat-select formControlName="contentType">
            <mat-option value="JSON">JSON</mat-option>
            <mat-option value="XML">XML</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>Auth type</mat-label>
          <mat-select formControlName="authType">
            <mat-option [value]="undefined">None</mat-option>
            <mat-option value="BASIC_AUTH">Basic auth</mat-option>
          </mat-select>
        </mat-form-field>

        @if (httpDataFormGroup.controls.authType.getRawValue() === 'BASIC_AUTH') {
          <div class="flex gap-2">
            <mat-form-field>
              <mat-label>Username</mat-label>
              <input matInput formControlName="basicAuthDataUsername" />
            </mat-form-field>

            <mat-form-field>
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="basicAuthDataPassword" />
            </mat-form-field>
          </div>
        }
      </div>

      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>Search term</mat-label>
          <textarea matInput formControlName="searchTerm"></textarea>
        </mat-form-field>
      </div>

      <mat-form-field>
        <mat-label>Body</mat-label>
        <textarea matInput formControlName="body"></textarea>
      </mat-form-field>

      <mat-slide-toggle formControlName="ignoreTLS">Ignore TLS</mat-slide-toggle>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSelect,
    MatOption,
    MatSlideToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormHttpData {
  httpDataFormGroup = inject(MonitorEditFormDataService).httpDataFormGroup;
}
