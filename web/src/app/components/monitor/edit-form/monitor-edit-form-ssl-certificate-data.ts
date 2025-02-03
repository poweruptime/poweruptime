import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-ssl-certificate-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="sslCertificateDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>URL</mat-label>
          <input matInput formControlName="url" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Minimum valid days</mat-label>
          <input matInput formControlName="validDaysLeft" />
        </mat-form-field>
      </div>
    </div>
  `,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormSSLCertificateData {
  sslCertificateDataFormGroup = inject(MonitorEditFormDataService).sslCertificateDataFormGroup;
}
