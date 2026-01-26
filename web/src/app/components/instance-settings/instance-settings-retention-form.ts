import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmFormFieldImports} from '@spartan-ng/helm/form-field';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';

import {BackendType, Database} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form
      class="h-full"
      id="retention-form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()"
      hlmCard>
      <div class="flex flex-col gap-6">
        <div hlmCardHeader>
          <div class="flex items-center gap-2">
            <h3 hlmCardTitle>{{ 'instanceSettings.retention.title' | transloco }}</h3>
          </div>
          <p hlmCardDescription>Configure how long data is stored</p>
        </div>
        <div class="grid gap-4 md:grid-cols-2" hlmCardContent>
          <hlm-form-field>
            <label hlmLabel for="checkResultRetentionPeriodInDays">
              {{ 'instanceSettings.retention.checkResult' | transloco }}
            </label>

            <div hlmInputGroup>
              <input
                id="checkResultRetentionPeriodInDays"
                hlmInputGroupInput
                formControlName="checkResultRetentionPeriodInDays"
                step="1"
                type="number" />
              <div hlmInputGroupAddon align="inline-end">days</div>
            </div>

            @let checkResultRetentionPeriodInDaysErrors =
              form.controls.checkResultRetentionPeriodInDays.errors;

            @if (checkResultRetentionPeriodInDaysErrors?.['required']) {
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (checkResultRetentionPeriodInDaysErrors?.['min']; as min) {
              <hlm-error>{{ 'form.validation.min' | transloco: min }}</hlm-error>
            }
            @if (checkResultRetentionPeriodInDaysErrors?.['max']; as max) {
              <hlm-error>{{ 'form.validation.max' | transloco: max }}</hlm-error>
            }
            @if (checkResultRetentionPeriodInDaysErrors?.['pattern']) {
              <hlm-error>{{ 'form.validation.integer' | transloco }}</hlm-error>
            }
          </hlm-form-field>

          <hlm-form-field>
            <label hlmLabel for="checkResultLogRetentionPeriodInDays">
              {{ 'instanceSettings.retention.logs' | transloco }}
            </label>

            <div hlmInputGroup>
              <input
                id="checkResultLogRetentionPeriodInDays"
                hlmInputGroupInput
                formControlName="checkResultLogRetentionPeriodInDays"
                step="1"
                type="number" />
              <div hlmInputGroupAddon align="inline-end">days</div>
            </div>

            @let checkResultLogRetentionPeriodInDaysErrors =
              form.controls.checkResultLogRetentionPeriodInDays.errors;

            @if (checkResultLogRetentionPeriodInDaysErrors?.['required']) {
              <hlm-error>{{ 'form.validation.required' | transloco }}</hlm-error>
            }
            @if (checkResultLogRetentionPeriodInDaysErrors?.['min']; as min) {
              <hlm-error>{{ 'form.validation.min' | transloco: min }}</hlm-error>
            }
            @if (checkResultLogRetentionPeriodInDaysErrors?.['max']; as max) {
              <hlm-error>{{ 'form.validation.max' | transloco: max }}</hlm-error>
            }
            @if (checkResultLogRetentionPeriodInDaysErrors?.['pattern']) {
              <hlm-error>{{ 'form.validation.integer' | transloco }}</hlm-error>
            }
          </hlm-form-field>
        </div>
      </div>
      <div hlmCardFooter>
        <pu-save-button [valid]="isValid()" form="retention-form" />
      </div>
    </form>
  `,
  selector: 'pu-instance-settings-retention-form',
  imports: [
    SaveButton,
    ReactiveFormsModule,
    TranslocoPipe,
    HlmCardImports,
    HlmFormFieldImports,
    HlmLabelImports,
    HlmInputGroupImports,
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
