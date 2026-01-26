import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';

import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';

import {CopyIconButton} from '@app/components';

import {MonitorEditFormDataCard} from './monitor-edit-form-data-card';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-push-data',
  template: `
    <pu-monitor-edit-form-data-card type="PUSH">
      <div class="flex flex-col gap-4" [formGroup]="pushDataFormGroup">
        <mat-form-field>
          <mat-label>{{ 'monitor.edit.pushUrl' | transloco }}</mat-label>
          <input [value]="pushUrl()" readonly matInput />
          <pu-copy-icon-button [content]="pushUrl()" matSuffix />
        </mat-form-field>
      </div>
    </pu-monitor-edit-form-data-card>
  `,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    TranslocoPipe,
    CopyIconButton,
    MonitorEditFormDataCard,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormPushData {
  pushDataFormGroup = inject(MonitorEditFormDataService).pushDataFormGroup;

  pushId = toSignal(this.pushDataFormGroup.controls['pushId'].valueChanges, {
    initialValue: this.pushDataFormGroup.controls['pushId'].value,
  });

  pushUrl = computed(
    () =>
      `https://${window.location.host}/api/v1/public/push/${this.pushId()}?status=UP&title=OK&message=&pingMs=`,
  );
}
