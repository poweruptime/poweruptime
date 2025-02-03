import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {cl_copy} from 'dfts-helper';
import {BiComponent} from 'dfx-bootstrap-icons';
import {toast} from 'ngx-sonner';

import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-push-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="pushDataFormGroup">
      <mat-form-field>
        <mat-label>Push URL</mat-label>
        <input [value]="pushUrl()" readonly matInput />
        <button (click)="copy()" type="button" matSuffix mat-icon-button aria-label="Copy">
          <bi name="copy" />
        </button>
      </mat-form-field>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatIconButton,
    MatSuffix,
    BiComponent,
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

  copy(): void {
    cl_copy(this.pushUrl());
    toast('Copied!');
  }
}
