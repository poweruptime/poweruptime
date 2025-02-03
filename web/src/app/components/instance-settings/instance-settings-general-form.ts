import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';

import {map, timer} from 'rxjs';

import {BiComponent} from 'dfx-bootstrap-icons';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType} from '@app/api';
import {AbstractModelEditFormComponent, SaveButton, injectIsValid} from '@app/form';

@Component({
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>General</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form
          class="mt-6 flex flex-col gap-4"
          id="form"
          #formRef
          [formGroup]="form"
          (ngSubmit)="submit()">
          <div>
            <mat-form-field>
              <mat-label>Instance Timezone</mat-label>
              <mat-select #singleSelect formControlName="timezone" placeholder="Bank">
                <mat-option class="pt-1">
                  <ngx-mat-select-search [formControl]="timezoneFilterControl">
                    <bi name="x-lg" ngxMatSelectSearchClear />
                  </ngx-mat-select-search>
                </mat-option>
                @for (timeZone of filteredTimezones(); track timeZone) {
                  <mat-option [value]="timeZone">
                    {{ timeZone }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div>
              <span>Time:</span>
              {{ nowInTimezone() | date: 'YYYY-MM-dd HH:mm:ss' }}
            </div>
          </div>

          <pu-save-button [valid]="isValid()" />
        </form>
      </mat-card-content>
    </mat-card>
  `,
  selector: 'pu-instance-settings-general-form',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatSelect,
    MatLabel,
    MatOption,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    NgxMatSelectSearchModule,
    BiComponent,
    SaveButton,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceSettingsGeneralForm extends AbstractModelEditFormComponent<
  BackendType['InstanceSettingsResponse'],
  BackendType['InstanceSettingsResponse']
> {
  override form = this.fb.nonNullable.group({
    timezone: ['', [Validators.required]],
  });

  readonly isValid = injectIsValid(this.form);

  readonly now = toSignal(timer(0, 1000).pipe(map(() => new Date())), {initialValue: new Date()});
  readonly timezone = toSignal(this.form.controls.timezone.valueChanges);
  readonly nowInTimezone = computed(() =>
    this.now().toLocaleString('en', {timeZone: this.timezone()}),
  );

  availableTimezones = input<string[]>();

  settings = input.required({
    transform: (it: BackendType['InstanceSettingsResponse']) => {
      this.form.patchValue(it);
      return it;
    },
  });

  readonly timezoneFilterControl = new FormControl('');
  readonly timezoneFilter = toSignal(
    this.timezoneFilterControl.valueChanges.pipe(map((it) => it ?? '')),
    {
      initialValue: '',
    },
  );

  readonly filteredTimezones = computed(() => {
    const filter = this.timezoneFilter().trim().toLowerCase();
    return (
      this.availableTimezones()
        ?.filter((it) => it.trim().toLowerCase().includes(filter))
        ?.sort((a, b) =>
          a
            .toLowerCase()
            .localeCompare(b.toLowerCase(), undefined, {numeric: true, sensitivity: 'base'}),
        ) ?? []
    );
  });
}
