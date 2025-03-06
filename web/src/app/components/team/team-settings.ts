import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {outputFromObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatOption, MatSelect} from '@angular/material/select';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

@Component({
  template: `
    <mat-form-field>
      <mat-label>{{ 'general.timezone' | transloco }}</mat-label>
      <mat-select [formControl]="timezoneControl" placeholder="Bank">
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
  `,
  selector: 'pu-team-settings',
  imports: [
    MatFormField,
    MatSelect,
    MatOption,
    NgxMatSelectSearchModule,
    ReactiveFormsModule,
    BiComponent,
    MatLabel,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamSettings {
  availableTimezones = input<string[]>();

  selectedTimezone = input.required({
    transform: (it: string | undefined) => {
      if (!it) {
        return undefined;
      }
      this.timezoneControl.setValue(it, {emitEvent: false});
      return it;
    },
  });

  timezoneControl = new FormControl('');
  timezoneFilterControl = new FormControl('');
  timezoneFilter = toSignal(this.timezoneFilterControl.valueChanges.pipe(map((it) => it ?? '')), {
    initialValue: '',
  });

  filteredTimezones = computed(() => {
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

  timezoneChange = outputFromObservable(this.timezoneControl.valueChanges);
}
