import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';

import {map, timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

@Component({
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ 'general.timezone' | transloco }}</mat-label>
      <mat-select [(ngModel)]="value">
        <mat-option class="pt-1">
          <ngx-mat-select-search [(ngModel)]="timezoneFilter">
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
      <span>{{ 'general.time' | transloco }}:</span>
      {{ nowInTimezone() | date: 'YYYY.MM.dd HH:mm:ss' }}
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimezoneInput),
      multi: true,
    },
  ],
  selector: 'pu-timezone-input',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatFormField,
    MatSelect,
    MatOption,
    MatLabel,
    NgxMatSelectSearchModule,
    BiComponent,
    TranslocoPipe,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneInput implements ControlValueAccessor {
  availableTimezones = input([], {transform: (it: string[] | undefined) => it ?? []});

  value = signal<string | null>('');
  isDisabled = signal(false);
  onChange?: (it: string | null) => void;

  timezoneFilter = signal('');

  filteredTimezones = computed(() => {
    const filter = this.timezoneFilter().trim().toLowerCase();
    return this.availableTimezones()
      .filter((it) => it.trim().toLowerCase().includes(filter))
      .sort((a, b) =>
        a
          .toLowerCase()
          .localeCompare(b.toLowerCase(), undefined, {numeric: true, sensitivity: 'base'}),
      );
  });

  readonly now = toSignal(timer(0, 1000).pipe(map(() => new Date())), {initialValue: new Date()});
  readonly nowInTimezone = computed(() =>
    this.now().toLocaleString('en', {timeZone: this.value() ?? undefined}),
  );

  constructor() {
    effect(() => {
      this.onChange?.(this.value());
    });
  }

  writeValue(it: string): void {
    this.value.set(it);
  }
  registerOnChange(fn: (it: string | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(_: any): void {}
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
}
