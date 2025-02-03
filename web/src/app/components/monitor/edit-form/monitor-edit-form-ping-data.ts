import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-ping-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="pingDataFormGroup">
      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>IP</mat-label>
          <input matInput formControlName="ip" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Port</mat-label>
          <input matInput type="number" formControlName="port" />
        </mat-form-field>
      </div>
    </div>
  `,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormPingData {
  pingDataFormGroup = inject(MonitorEditFormDataService).pingDataFormGroup;
}
