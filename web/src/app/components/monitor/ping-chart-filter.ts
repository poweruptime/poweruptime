import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerToggle,
  MatEndDate,
  MatStartDate,
} from '@angular/material/datepicker';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';

@Component({
  template: `
    <form [formGroup]="form">
      <mat-form-field>
        <mat-label>Start - End</mat-label>
        <mat-date-range-input [rangePicker]="picker" formGroupName="range">
          <input matStartDate formControlName="start" placeholder="Start date" />
          <input matEndDate formControlName="end" placeholder="End date" />
        </mat-date-range-input>
        <mat-datepicker-toggle [for]="picker" matIconSuffix></mat-datepicker-toggle>
        <mat-date-range-picker #picker></mat-date-range-picker>

        <!--        @if (range.controls.start.hasError('matStartDateInvalid')) {-->
        <!--          <mat-error>Invalid start date</mat-error>-->
        <!--        }-->
        <!--        @if (range.controls.end.hasError('matEndDateInvalid')) {-->
        <!--          <mat-error>Invalid end date</mat-error>-->
        <!--        }-->
      </mat-form-field>
    </form>
    {{ form.controls.range.controls.start.getRawValue() }}
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
  ],
})
export class PingChartFilter {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    range: this.fb.group({
      start: [null as string | null, [Validators.required]],
      end: [null as string | null, [Validators.required]],
    }),
  });
}
