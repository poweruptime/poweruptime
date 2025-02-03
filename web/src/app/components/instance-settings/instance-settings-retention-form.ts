import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Individual check & log retention</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form id="form" #formRef [formGroup]="form" (ngSubmit)="submit()">
          <div class="mt-6 flex gap-4">
            <mat-form-field class="w-40">
              <mat-label>Check retention</mat-label>
              <input matInput type="number" formControlName="checkResultRetentionPeriodInDays" />
              <span matSuffix>days</span>
            </mat-form-field>
            <mat-form-field class="w-40">
              <mat-label>Logs retention</mat-label>
              <input matInput type="number" formControlName="checkResultLogRetentionPeriodInDays" />
              <span matSuffix>days</span>
            </mat-form-field>
          </div>

          <pu-save-button [valid]="isValid()" />
        </form>
      </mat-card-content>
    </mat-card>
  `,
  selector: 'pu-instance-settings-retention-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatSuffix,
    NgxMatSelectSearchModule,
    SaveButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsRetentionForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingsResponse'],
  BackendType['InstanceSettingsResponse']
> {
  override form = this.fb.nonNullable.group({
    checkResultRetentionPeriodInDays: [
      180,
      [
        Validators.required,
        Validators.min(7),
        Validators.max(3650),
        Validators.pattern(Database.INTEGER_REGEX),
      ],
    ],
    checkResultLogRetentionPeriodInDays: [
      90,
      [
        Validators.required,
        Validators.min(3),
        Validators.max(365),
        Validators.pattern(Database.INTEGER_REGEX),
      ],
    ],
  });

  readonly isValid = injectIsValid(this.form);

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);

      return it;
    },
  });
}
