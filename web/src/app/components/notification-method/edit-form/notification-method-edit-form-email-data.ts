import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {NotificationMethodEditFormDataService} from './notification-method-edit-form-data.service';

@Component({
  selector: 'pu-notification-method-edit-form-email-data',
  template: `
    <div class="flex flex-col gap-4" [formGroup]="emailDataFormGroup">
      <mat-form-field>
        <mat-label>To</mat-label>
        <input matInput type="email" formControlName="to" />
      </mat-form-field>

      <div class="flex gap-2">
        <mat-form-field class="grow">
          <mat-label>Host</mat-label>
          <input matInput formControlName="host" />
        </mat-form-field>

        <mat-form-field class="max-w-24">
          <mat-label>Port</mat-label>
          <input matInput type="number" formControlName="port" />
        </mat-form-field>
      </div>

      <div class="flex gap-2">
        <mat-form-field>
          <mat-label>Username</mat-label>
          <input matInput formControlName="username" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
      </div>
    </div>
  `,
  imports: [ReactiveFormsModule, MatFormField, MatInput, MatLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodEditFormEmailData {
  emailDataFormGroup = inject(NotificationMethodEditFormDataService).emailDataFormGroup;
}
