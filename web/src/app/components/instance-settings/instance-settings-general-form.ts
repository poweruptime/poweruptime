import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType} from '@app/api';
import {TimezoneInput} from '@app/components';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>{{ 'general.general' | transloco }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form
          class="mt-6 flex flex-col gap-4"
          id="general-form"
          #formRef
          [formGroup]="form"
          (ngSubmit)="submit()">
          <pu-timezone-input
            [availableTimezones]="availableTimezones()"
            formControlName="timezone" />

          <hr />

          <mat-slide-toggle formControlName="showNewVersionDialog">
            {{ 'instanceSettings.showNewVersionDialog' | transloco }}
          </mat-slide-toggle>

          <pu-save-button [valid]="isValid()" form="general-form" />
        </form>
      </mat-card-content>
    </mat-card>
  `,
  selector: 'pu-instance-settings-general-form',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    NgxMatSelectSearchModule,
    SaveButton,
    TranslocoPipe,
    TimezoneInput,
    MatSlideToggle,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsGeneralForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingsResponse'],
  BackendType['InstanceSettingsResponse']
> {
  override form = this.fb.nonNullable.group({
    timezone: ['', [Validators.required]],
    showNewVersionDialog: [true, [Validators.required]],
  });

  readonly isValid = injectIsValid(this.form);

  availableTimezones = input<string[]>();

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });
}
