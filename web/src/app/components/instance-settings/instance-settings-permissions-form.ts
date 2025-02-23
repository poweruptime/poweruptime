import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';

import {BackendType} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>{{ 'general.permissions' | transloco }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form
          class="mt-6 flex flex-col gap-4"
          id="permissions-form"
          #formRef
          [formGroup]="form"
          (ngSubmit)="submit()">
          <mat-slide-toggle formControlName="isUserAllowedToCreateTeams">
            {{ 'instanceSettings.permissions.allowUsersToCreateTeams' | transloco }}
          </mat-slide-toggle>

          <pu-save-button [valid]="isValid()" />
        </form>
      </mat-card-content>
    </mat-card>
  `,
  selector: 'pu-instance-settings-permissions-form',
  imports: [
    ReactiveFormsModule,
    MatSlideToggle,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    SaveButton,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsPermissionsForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingsResponse'],
  BackendType['InstanceSettingsResponse']
> {
  override form = this.fb.nonNullable.group({
    isUserAllowedToCreateTeams: [false, [Validators.required]],
  });

  readonly isValid = injectIsValid(this.form);

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });
}
