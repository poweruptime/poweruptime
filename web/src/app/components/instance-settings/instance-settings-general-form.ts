import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {ReactiveFormsModule, Validators} from '@angular/forms';

import {MatSlideToggle} from '@angular/material/slide-toggle';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType} from '@app/api';
import {TimezoneInput} from '@app/components';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <form
      class="h-full"
      id="general-form"
      #formRef
      [formGroup]="form"
      (ngSubmit)="submit()"
      hlmCard>
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
          <mat-slide-toggle formControlName="showNewVersionDialog">
            {{ 'instanceSettings.showNewVersionDialog' | transloco }}
          </mat-slide-toggle>
        </div>
      </form>
      <p hlmCardFooter>
        <pu-save-button [valid]="isValid()" form="general-form" />
      </p>
    </form>
  `,
  selector: 'pu-instance-settings-general-form',
  imports: [
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
    SaveButton,
    TranslocoPipe,
    TimezoneInput,
    MatSlideToggle,
    HlmCardImports,
    HlmIconImports,
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

  availableTimezones = input<string[]>();

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });
}
