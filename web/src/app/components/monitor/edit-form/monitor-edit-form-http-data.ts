import {ChangeDetectionStrategy, Component, computed, inject, model, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';

import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import {MatError, MatFormField, MatLabel} from '@angular/material/form-field';
import {MatHint, MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';
import {MatSlideToggle} from '@angular/material/slide-toggle';

import {CdkTextareaAutosize} from '@angular/cdk/text-field';

import {filter} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';

import {Database} from '../../../api';
import {MonitorEditFormDataService} from './monitor-edit-form-data.service';

@Component({
  selector: 'pu-monitor-edit-form-http-data',
  template: `
    <div class="grid grid-cols-8 gap-x-4 gap-y-2" [formGroup]="httpDataFormGroup">
      <mat-form-field class="col-span-8 xl:col-span-4">
        <mat-label>{{ 'general.url' | transloco }}</mat-label>
        <input matInput formControlName="url" />

        @let urlErrors = httpDataFormGroup.controls.url.errors;
        @if (urlErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (urlErrors?.['minlength']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (urlErrors?.['maxlength']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
        @if (urlErrors?.['pattern']) {
          <mat-error>{{ 'form.validation.url' | transloco }}</mat-error>
        }
      </mat-form-field>

      <mat-form-field class="col-span-8 xl:col-span-2">
        <mat-label>{{ 'general.method' | transloco }}</mat-label>
        <mat-select formControlName="method">
          <mat-option value="GET">GET</mat-option>
          <mat-option value="POST">POST</mat-option>
          <mat-option value="PUT">PUT</mat-option>
          <mat-option value="PATCH">PATCH</mat-option>
          <mat-option value="DELETE">DELETE</mat-option>
          <mat-option value="HEAD">HEAD</mat-option>
          <mat-option value="OPTIONS">OPTIONS</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field class="col-span-8 xl:col-span-2">
        <mat-label>{{ 'general.contentType' | transloco }}</mat-label>
        <mat-select formControlName="contentType">
          <mat-option value="JSON">JSON</mat-option>
          <mat-option value="XML">XML</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field class="col-span-8 xl:col-span-5">
        <mat-label>{{ 'monitor.edit.http.allowedStatusCodeRanges.title' | transloco }}</mat-label>
        <mat-chip-grid
          #allowedStatusCodeRangesGrid
          [attr.aria-label]="'monitor.edit.http.allowedStatusCodeRanges.enter' | transloco"
          formControlName="allowedStatusCodeRanges">
          @for (
            statusCodeRange of httpDataFormGroup.controls.allowedStatusCodeRanges.getRawValue();
            track statusCodeRange
          ) {
            <mat-chip-row
              (removed)="
                remove(httpDataFormGroup.controls.allowedStatusCodeRanges, statusCodeRange)
              ">
              {{ statusCodeRange }}
              <button
                [attr.aria-label]="
                  'monitor.edit.http.allowedStatusCodeRanges.remove'
                    | transloco: {email: statusCodeRange}
                "
                type="button"
                matChipRemove>
                <ng-icon name="bootstrapXCircle" aria-hidden="true" />
              </button>
            </mat-chip-row>
          }
        </mat-chip-grid>
        <input
          [(ngModel)]="statusCodeRangeInput"
          [ngModelOptions]="{standalone: true}"
          [placeholder]="'monitor.edit.http.allowedStatusCodeRanges.new' | transloco"
          [matAutocomplete]="auto"
          [matChipInputFor]="allowedStatusCodeRangesGrid"
          [matChipInputAddOnBlur]="true"
          (matChipInputTokenEnd)="
            addEnter(httpDataFormGroup.controls.allowedStatusCodeRanges, $event)
          " />

        <mat-autocomplete
          #auto="matAutocomplete"
          (optionSelected)="select(httpDataFormGroup.controls.allowedStatusCodeRanges, $event)">
          @for (statusCodeRange of filteredPredefinedStatusCodeRanges(); track statusCodeRange) {
            <mat-option [value]="statusCodeRange">{{ statusCodeRange }}</mat-option>
          }
        </mat-autocomplete>

        @let allowedStatusCodeRangeErrors =
          httpDataFormGroup.controls.allowedStatusCodeRanges.errors;
        @if (allowedStatusCodeRangeErrors?.['required']) {
          <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
        }
        @if (allowedStatusCodeRangeErrors?.['patternArrayItem']) {
          {{ 'monitor.edit.http.allowedStatusCodeRanges.inputRegexError' | transloco }}
        }
        @if (allowedStatusCodeRangeErrors?.['minLengthArrayItem']; as minlength) {
          <mat-error>{{ 'form.validation.minlength' | transloco: minlength }}</mat-error>
        }
        @if (allowedStatusCodeRangeErrors?.['maxLengthArrayItem']; as maxlength) {
          <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
        }
        @if (allowedStatusCodeRangeErrors?.['inputRegex']) {
          <mat-error>
            {{ 'monitor.edit.http.allowedStatusCodeRanges.inputRegexError' | transloco }}
          </mat-error>
        }
        @if (allowedStatusCodeRangeErrors?.['inputStartBiggerThenEnd']) {
          <mat-error>
            {{
              'monitor.edit.http.allowedStatusCodeRanges.inputStartBiggerThenEndError' | transloco
            }}
          </mat-error>
        }
        @if (allowedStatusCodeRangeErrors?.['rangeIncorrect']) {
          <mat-error>
            {{ 'monitor.edit.http.allowedStatusCodeRanges.rangeIncorrectError' | transloco }}
          </mat-error>
        }
      </mat-form-field>

      <div class="col-span-8 xl:col-span-3">
        <mat-form-field class="w-full">
          <mat-label>{{ 'monitor.edit.http.maxRedirects.label' | transloco }}</mat-label>
          <input matInput type="number" step="1" formControlName="maxRedirects" />

          <mat-hint align="start">{{ 'monitor.edit.http.maxRedirects.hint' | transloco }}</mat-hint>

          @let maxRedirectErrors = httpDataFormGroup.controls.maxRedirects.errors;
          @if (maxRedirectErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (maxRedirectErrors?.['max']; as max) {
            <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
          }
          @if (maxRedirectErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>
      </div>

      <mat-form-field class="col-span-8 xl:col-span-2">
        <mat-label>{{ 'monitor.edit.http.authType' | transloco }}</mat-label>
        <mat-select formControlName="authType">
          <mat-option [value]="undefined">None</mat-option>
          <mat-option value="BASIC_AUTH">Basic auth</mat-option>
        </mat-select>
      </mat-form-field>

      @if (httpDataFormGroup.controls.authType.getRawValue() === 'BASIC_AUTH') {
        <mat-form-field class="col-span-8 xl:col-span-3">
          <mat-label>{{ 'general.username' | transloco }}</mat-label>
          <input matInput formControlName="basicAuthDataUsername" />
          @let basicAuthUsernameErrors = httpDataFormGroup.controls.basicAuthDataUsername.errors;
          @if (basicAuthUsernameErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (basicAuthUsernameErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field class="col-span-8 xl:col-span-3">
          <mat-label>{{ 'general.password' | transloco }}</mat-label>
          <input matInput type="password" formControlName="basicAuthDataPassword" />
          @let basicAuthPasswordErrors = httpDataFormGroup.controls.basicAuthDataPassword.errors;
          @if (basicAuthPasswordErrors?.['required']) {
            <mat-error>{{ 'form.validation.required' | transloco }}</mat-error>
          }
          @if (basicAuthPasswordErrors?.['maxlength']; as maxlength) {
            <mat-error>{{ 'form.validation.maxlength' | transloco: maxlength }}</mat-error>
          }
        </mat-form-field>
      }

      <mat-form-field class="col-span-8">
        <mat-label>{{ 'monitor.edit.http.searchTerm' | transloco }}</mat-label>
        <textarea
          matInput
          formControlName="searchTerm"
          rows="3"
          cdkTextareaAutosize
          cdkAutosizeMinRows="3"></textarea>
      </mat-form-field>

      <mat-form-field class="col-span-8">
        <mat-label>{{ 'general.body' | transloco }}</mat-label>
        <textarea
          matInput
          formControlName="body"
          rows="3"
          cdkTextareaAutosize
          cdkAutosizeMinRows="3"></textarea>
      </mat-form-field>

      <div class="col-span-4 flex min-h-14 items-center">
        <mat-slide-toggle formControlName="certificateExpiry">
          {{ 'monitor.edit.http.certificateExpiry' | transloco }}
        </mat-slide-toggle>
      </div>

      @if (httpDataFormGroup.controls.certificateExpiry.getRawValue()) {
        <mat-form-field class="col-span-4" subscriptSizing="dynamic">
          <mat-label>{{ 'monitor.edit.ssl.validDaysLeft' | transloco }}</mat-label>
          <input matInput type="number" step="1" formControlName="certificateValidDaysLeft" />

          @let validDaysLeftErrors = httpDataFormGroup.controls.certificateValidDaysLeft.errors;
          @if (validDaysLeftErrors?.['min']; as min) {
            <mat-error>{{ 'form.validation.min' | transloco: min }}</mat-error>
          }
          @if (validDaysLeftErrors?.['max']; as max) {
            <mat-error>{{ 'form.validation.max' | transloco: max }}</mat-error>
          }
          @if (validDaysLeftErrors?.['pattern']) {
            <mat-error>{{ 'form.validation.integer' | transloco }}</mat-error>
          }
        </mat-form-field>
      }

      <mat-slide-toggle class="col-span-8" formControlName="ignoreTLS">
        {{ 'monitor.edit.http.ignoreTLS' | transloco }}
      </mat-slide-toggle>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSelect,
    MatHint,
    MatOption,
    MatSlideToggle,
    TranslocoPipe,
    CdkTextareaAutosize,
    NgIcon,
    MatChipGrid,
    MatChipInput,
    MatChipRemove,
    MatChipRow,
    MatAutocomplete,
    FormsModule,
    MatAutocompleteTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorEditFormHttpData {
  httpDataFormGroup = inject(MonitorEditFormDataService).httpDataFormGroup;

  allowedStatusCodeRanges = toSignal(
    this.httpDataFormGroup.controls.allowedStatusCodeRanges.valueChanges.pipe(
      filter((it): it is string[] => !!it),
    ),
    {initialValue: this.httpDataFormGroup.controls.allowedStatusCodeRanges.getRawValue() ?? []},
  );

  statusCodeRangeInput = model('');

  readonly predefinedStatusCodeRanges = signal([
    '100 - 199',
    '200 - 299',
    '300 - 399',
    '400 - 499',
    '500 - 599',
    '400 - 599',
  ]);

  readonly filteredPredefinedStatusCodeRanges = computed(() => {
    const allowedStatusCodeRanges = this.allowedStatusCodeRanges();
    const statusCodeRanges = this.predefinedStatusCodeRanges().filter(
      (it) => !allowedStatusCodeRanges.includes(it),
    );
    const value = this.statusCodeRangeInput().trim().toLowerCase();

    if (value.length === 0) {
      return statusCodeRanges;
    }

    return statusCodeRanges.filter((it) => it.trim().toLowerCase().includes(value));
  });

  remove(control: FormControl<string[] | null>, keyword: string) {
    const values = control.value;

    if (!values) {
      return;
    }

    const index = values.indexOf(keyword);
    if (index < 0) {
      return;
    }

    values.splice(index, 1);
    control.setValue([...values]);
  }

  addEnter(control: FormControl<string[] | null>, event: MatChipInputEvent): void {
    if (this.add(control, event.value)) {
      event.chipInput!.clear();
    }
  }

  select(control: FormControl<string[] | null>, event: MatAutocompleteSelectedEvent): void {
    if (this.add(control, event.option.viewValue)) {
      this.statusCodeRangeInput.set('');
      event.option.deselect();
    }
  }

  add(control: FormControl<string[] | null>, rawValue: string): boolean {
    const value = rawValue.trim();

    if (value.length === 0) {
      return false;
    }

    // HACK
    // The chip grid will reset the errors on leaving the input box
    // This slightly delays the setting of said error, so it happens after the chip grid resetting the errors
    if (!Database.STATUS_CODE_REGEX.test(value)) {
      setTimeout(() => {
        control.setErrors({inputRegex: true});
      }, 10);
      return false;
    }

    const parts = value.split('-').map((it) => it.trim());
    const start = Number(parts[0]);
    const end = Number(parts[1]);

    if (start < 100 || end > 599) {
      setTimeout(() => {
        control.setErrors({rangeIncorrect: true});
      }, 10);
      return false;
    }

    if (start > end) {
      setTimeout(() => {
        control.setErrors({inputStartBiggerThenEnd: true});
      }, 10);
      return false;
    }

    control.setValue([...(control.value ?? []), `${start} - ${end}`]);

    return true;
  }
}
