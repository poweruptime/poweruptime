import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerToggle,
  MatEndDate,
  MatStartDate,
} from '@angular/material/datepicker';
import {MatError, MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';

import {distinctUntilChanged, filter, map, tap} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';

import {dateRangeValidator} from '@app/form';
import {toBackendDate} from '@app/services/util';

@Component({
  template: `
    <form class="flex flex-wrap justify-end gap-2 gap-y-4" [formGroup]="form">
      <div>
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'general.precision' | transloco }}</mat-label>
          <mat-select formControlName="precision">
            <mat-option [value]="2">{{ 'general.xMinutes' | transloco: {value: 2} }}</mat-option>
            <mat-option [value]="5">{{ 'general.xMinutes' | transloco: {value: 5} }}</mat-option>
            <mat-option [value]="15">{{ 'general.xMinutes' | transloco: {value: 15} }}</mat-option>
            <mat-option [value]="30">{{ 'general.xMinutes' | transloco: {value: 30} }}</mat-option>
            <mat-option [value]="60">{{ 'general.xMinutes' | transloco: {value: 60} }}</mat-option>
            <mat-option [value]="180">{{ 'general.xHours' | transloco: {value: 3} }}</mat-option>
            <mat-option [value]="360">{{ 'general.xHours' | transloco: {value: 6} }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div>
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'general.startEnd' | transloco }}</mat-label>
          <mat-date-range-input [rangePicker]="picker" [max]="max" formGroupName="range">
            <input
              [placeholder]="'monitor.details.pingChart.startDate' | transloco"
              matStartDate
              formControlName="start" />
            <input
              [placeholder]="'monitor.details.pingChart.endDate' | transloco"
              matEndDate
              formControlName="end" />
          </mat-date-range-input>
          <mat-datepicker-toggle [for]="picker" matIconSuffix></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
        </mat-form-field>
        @if (form.controls['range'].errors?.['invalidRange']) {
          <mat-error>{{ 'monitor.details.pingChart.exceedsMaxWindow' | transloco }}</mat-error>
        }
      </div>
    </form>
  `,
  selector: 'pu-ping-chart-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatLabel,
    MatFormField,
    MatDateRangeInput,
    MatDatepickerToggle,
    MatDateRangePicker,
    MatStartDate,
    MatEndDate,
    MatSuffix,
    MatSelect,
    MatError,
    MatOption,
    TranslocoPipe,
  ],
})
export class PingChartFilter {
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    precision: [5 as number | null, [Validators.required]],
    range: this.fb.group(
      {
        start: ['', [Validators.required]],
        end: ['', [Validators.required]],
      },
      {validators: dateRangeValidator(31)},
    ),
  });

  protected readonly max = new Date();

  filter = input.required({
    transform: (it: {range: {start: string; end: string}}) => {
      this.form.patchValue(it);
      return it;
    },
  });

  filterChange = outputFromObservable(
    this.form.valueChanges.pipe(
      filter(() => this.form.valid),
      map(() => this.form.getRawValue()),
      map(({range, ...it}) => ({
        ...it,
        range: {start: toBackendDate(range.start), end: toBackendDate(range.end)},
      })),
      distinctUntilChanged((_, cur) => JSON.stringify(cur) === JSON.stringify(this.filter())),
    ),
  );
}
