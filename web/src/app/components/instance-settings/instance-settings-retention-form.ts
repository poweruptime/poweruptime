import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>{{ 'instanceSettings.retention.title' | transloco }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form id="retention-form" #formRef [formGroup]="form" (ngSubmit)="submit()">
          <div class="mt-6 flex flex-wrap gap-4">
            <mat-form-field>
              <mat-label>{{ 'instanceSettings.retention.checkResult' | transloco }}</mat-label>
              <input matInput type="number" formControlName="checkResultRetentionPeriodInDays" />
              <span matSuffix>days</span>
              @let checkResultRetentionPeriodInDaysErrors =
                form.controls.checkResultRetentionPeriodInDays.errors;

              @if (checkResultRetentionPeriodInDaysErrors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (checkResultRetentionPeriodInDaysErrors?.['min']; as min) {
                <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
              }
              @if (checkResultRetentionPeriodInDaysErrors?.['max']; as max) {
                <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
              }
              @if (checkResultRetentionPeriodInDaysErrors?.['pattern']) {
                <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field>
              <mat-label>{{ 'instanceSettings.retention.logs' | transloco }}</mat-label>
              <input matInput type="number" formControlName="checkResultLogRetentionPeriodInDays" />
              <span matSuffix>days</span>
              @let checkResultLogRetentionPeriodInDaysErrors =
                form.controls.checkResultLogRetentionPeriodInDays.errors;

              @if (checkResultLogRetentionPeriodInDaysErrors?.['required']) {
                <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
              }
              @if (checkResultLogRetentionPeriodInDaysErrors?.['min']; as min) {
                <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
              }
              @if (checkResultLogRetentionPeriodInDaysErrors?.['max']; as max) {
                <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
              }
              @if (checkResultLogRetentionPeriodInDaysErrors?.['pattern']) {
                <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
              }
            </mat-form-field>
          </div>

          <pu-save-button [valid]="isValid()" form="retention-form" />
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
    MatError,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatSuffix,
    NgxMatSelectSearchModule,
    SaveButton,
    TranslocoPipe,
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
