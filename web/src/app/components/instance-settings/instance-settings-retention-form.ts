import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form id="retention-form" #formRef [formGroup]="form" (ngSubmit)="submit()" hlmCard>
      <div hlmCardHeader>
        <div class="flex items-center gap-2">
          <h3 hlmCardTitle>{{ 'instanceSettings.retention.title' | transloco }}</h3>
        </div>
        <p hlmCardDescription>Configure how long data is stored</p>
      </div>
      <div class="space-y-6" hlmCardContent>
        <div class="flex items-center justify-between space-x-2">
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
      </div>
      <div hlmCardFooter>
        <pu-save-button [valid]="isValid()" form="retention-form" />
      </div>
    </form>
  `,
  selector: 'pu-instance-settings-retention-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatSuffix,
    NgxMatSelectSearchModule,
    SaveButton,
    TranslocoPipe,
    HlmCardImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsRetentionForm extends AbstractModelEditFormComponent<
  BackendType['SettingRetentionDto'],
  BackendType['SettingRetentionDto']
> {
  override disableInputFocus = true;
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
    transform: (it: {
      checkResultRetentionPeriodInDays: number;
      checkResultLogRetentionPeriodInDays: number;
    }) => {
      this.form.patchValue(it);

      return it;
    },
  });
}
