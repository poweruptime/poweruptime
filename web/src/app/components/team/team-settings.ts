import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType} from '@app/api';
import {TimezoneInput} from '@app/components';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form class="grid gap-4" id="general-form" #formRef [formGroup]="form" (ngSubmit)="submit()">
      <pu-timezone-input [availableTimezones]="availableTimezones()" formControlName="timezone" />

      <pu-save-button [valid]="isValid()" form="general-form" />
    </form>
  `,
  selector: 'pu-team-settings',
  imports: [NgxMatSelectSearchModule, ReactiveFormsModule, TimezoneInput, SaveButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSettings extends AbstractModelEditFormComponent<
  BackendType['TeamSettingsResponse'],
  BackendType['TeamSettingsResponse']
> {
  override form = this.fb.nonNullable.group({
    timezone: ['', [Validators.required]],
  });

  readonly isValid = injectIsValid(this.form);

  availableTimezones = input<string[]>();

  settings = input.required({
    transform: (it: BackendType['TeamSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });
}
