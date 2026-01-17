import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';

import {BackendType} from '@app/api';
import {TimezoneInput} from '@app/components';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';
import {GroupedTimezones} from '@app/services';

@Component({
  template: `
    <form
      class="h-full flex-col justify-between"
      id="general-form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()"
      hlmCard>
      <div class="flex flex-col gap-6">
        <div hlmCardHeader>
          <div class="flex items-center gap-2">
            <ng-icon name="bootstrapGlobe" helm />
            <h3 hlmCardTitle>{{ 'general.general' | transloco }}</h3>
          </div>
          <p hlmCardDescription>Configure your basic application settings</p>
        </div>
        <form class="space-y-6" hlmCardContent>
          <div class="space-y-2">
            <pu-timezone-input
              [availableTimezones]="availableTimezones()"
              formControlName="timezone" />
          </div>

          <hr />

          <div class="flex items-center justify-between space-x-2">
            <label class="flex items-center" hlmLabel for="showNewVersionDialog">
              <hlm-switch
                class="mr-2"
                id="showNewVersionDialog"
                formControlName="showNewVersionDialog" />
              {{ 'instanceSettings.showNewVersionDialog' | transloco }}
            </label>
          </div>
        </form>
      </div>
      <p hlmCardFooter>
        <pu-save-button [valid]="isValid()" form="general-form" />
      </p>
    </form>
  `,
  selector: 'pu-instance-settings-general-form',
  imports: [
    ReactiveFormsModule,
    SaveButton,
    TranslocoPipe,
    TimezoneInput,
    HlmCardImports,
    HlmIconImports,
    HlmLabelImports,
    HlmSwitchImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsGeneralForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingsResponse'],
  BackendType['InstanceSettingsResponse']
> {
  override disableInputFocus = true;
  override form = this.fb.nonNullable.group({
    timezone: ['', [Validators.required]],
    showNewVersionDialog: [true, [Validators.required]],
  });

  readonly isValid = injectIsValid(this.form);

  availableTimezones = input<GroupedTimezones[]>();

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });
}
