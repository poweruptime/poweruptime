import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {BackendType} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form id="permissions-form" #formRef [formGroup]="form" (ngSubmit)="submit()" hlmCard>
      <div hlmCardHeader>
        <div class="flex items-center gap-2">
          <ng-icon name="bootstrapShield" helm />
          <h3 hlmCardTitle>{{ 'general.permissions' | transloco }}</h3>
        </div>
        <p hlmCardDescription>Control user access and capabilities</p>
      </div>
      <div class="space-y-6" hlmCardContent>
        <div class="flex items-center justify-between space-x-2">
          <mat-slide-toggle formControlName="isUserAllowedToCreateTeams">
            {{ 'instanceSettings.permissions.allowUsersToCreateTeams' | transloco }}
          </mat-slide-toggle>
        </div>
      </div>
      <div hlmCardFooter>
        <pu-save-button [valid]="isValid()" form="permissions-form" />
      </div>
    </form>
  `,
  selector: 'pu-instance-settings-permissions-form',
  imports: [
    ReactiveFormsModule,
    MatSlideToggle,
    SaveButton,
    TranslocoPipe,
    HlmCardImports,
    HlmIconImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsPermissionsForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingsResponse'],
  BackendType['InstanceSettingsResponse']
> {
  override disableInputFocus = true;
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
