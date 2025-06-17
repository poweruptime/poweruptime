import {LiveAnnouncer} from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import {MatChipGrid, MatChipInput, MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatProgressBar} from '@angular/material/progress-bar';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '../../api';

@Component({
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ 'monitor.selector.selected' | transloco }}</mat-label>
      <mat-chip-grid #chipGrid [attr.aria-label]="'monitor.selector.list' | transloco">
        @for (monitor of value(); track monitor.id) {
          <a (removed)="remove(monitor)" mat-chip-row>
            {{ monitor.name }}
            <button
              [attr.aria-label]="'monitor.selector.remove' | transloco: monitor"
              type="button"
              matChipRemove
              stopPropagation>
              <bi name="x-circle" aria-hidden="true" />
            </button>
          </a>
        }
      </mat-chip-grid>
      <input
        [(ngModel)]="searchMonitor"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [placeholder]="'monitor.selector.add' | transloco"
        name="searchNotificationMethod" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
        @if (isPending()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @for (monitor of filteredMonitors(); track monitor.id) {
          <mat-option [value]="monitor">{{ monitor.name }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  selector: 'pu-monitor-selector',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonitorSelector),
      multi: true,
    },
  ],
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatChipGrid,
    MatChipRow,
    MatChipInput,
    MatChipRemove,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatProgressBar,
    BiComponent,
    StopPropagationDirective,
    TranslocoPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorSelector implements ControlValueAccessor {
  readonly announcer = inject(LiveAnnouncer);

  monitors = input.required<BackendType['MonitorMinResponse'][]>();
  isPending = input.required<boolean>();
  searchMonitor = model('');

  readonly filteredMonitors = computed(() => {
    const selectedMonitors = this.value()?.map((it) => it.id);
    return this.monitors().filter((it) => !selectedMonitors?.includes(it.id));
  });

  remove(monitor: BackendType['MonitorMinResponse']): void {
    this.value.update((selectedMonitors) => {
      if (!selectedMonitors) {
        return null;
      }

      const index = selectedMonitors.findIndex((it) => it.id === monitor.id);
      if (index < 0) {
        return selectedMonitors;
      }

      selectedMonitors.splice(index, 1);
      void this.announcer.announce(`Removed ${monitor.name}`);
      return [...selectedMonitors];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.value.update((monitors) => [...(monitors ?? []), event.option.value]);
    this.searchMonitor.set('');
    event.option.deselect();
  }

  value = signal<BackendType['MonitorMinResponse'][] | null>(null);
  isDisabled = signal(false);
  onChange?: (it: BackendType['MonitorMinResponse'][] | null) => void;

  constructor() {
    effect(() => {
      this.onChange?.(this.value());
    });
  }

  writeValue(it: BackendType['MonitorMinResponse'][]): void {
    this.value.set(it);
  }
  registerOnChange(fn: (it: BackendType['MonitorMinResponse'][] | null) => void): void {
    this.onChange = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  registerOnTouched(_: unknown): void {}
}
