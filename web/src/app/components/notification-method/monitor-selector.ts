import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmComboboxImports} from '@spartan-ng/helm/combobox';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSpinnerImports} from '@spartan-ng/helm/spinner';

import {BackendType} from '@app/api';

@Component({
  template: `
    <div class="grid gap-2">
      <label hlmLabel for="notificationMethods">
        {{ 'monitor.selector.selected' | transloco }}
      </label>
      <hlm-combobox-multiple
        [(search)]="searchMonitor"
        [(value)]="value"
        [disabled]="isDisabled()"
        [itemToString]="itemToString"
        [isItemEqualToValue]="isItemEqualToValue">
        <hlm-combobox-chips>
          <ng-template hlmComboboxValues let-values>
            @for (value of values; track $index) {
              <hlm-combobox-chip [value]="value">{{ value.name }}</hlm-combobox-chip>
            }
          </ng-template>

          <input
            id="notificationMethods"
            [placeholder]="'monitor.selector.add' | transloco"
            hlmComboboxChipInput />
        </hlm-combobox-chips>
        <div *hlmComboboxPortal hlmComboboxContent>
          @if (showStatus()) {
            <hlm-combobox-status>
              @if (isPending()) {
                <hlm-spinner />
                Loading...
              } @else if (searchMonitor().length === 0) {
                Type to search Monitors.
              }
            </hlm-combobox-status>
          }
          @if (!isPending()) {
            <hlm-combobox-empty>Try a different search term.</hlm-combobox-empty>
          }
          <div hlmComboboxList>
            @if (monitors(); as value) {
              @for (monitor of value; track monitor.id) {
                <hlm-combobox-item [value]="monitor">
                  {{ monitor.name }}
                </hlm-combobox-item>
              }
            }
          </div>
        </div>
      </hlm-combobox-multiple>
    </div>
  `,
  selector: 'pu-monitor-selector',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonitorSelector),
      multi: true,
    },
  ],
  imports: [FormsModule, TranslocoPipe, HlmComboboxImports, HlmSpinnerImports, HlmLabelImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorSelector implements ControlValueAccessor {
  protected itemToString = (it: BackendType['MonitorMinResponse']) => it.name;
  protected isItemEqualToValue = (
    itemValue: BackendType['MonitorMinResponse'],
    selectedValue: BackendType['MonitorMinResponse'] | null,
  ) => itemValue.id === selectedValue?.id;

  protected readonly showStatus = computed(
    () => this.isPending() || this.searchMonitor().length === 0,
  );

  readonly monitors = input.required<BackendType['MonitorMinResponse'][]>();
  readonly isPending = input.required<boolean>();
  searchMonitor = model('');

  protected readonly value = signal<BackendType['MonitorMinResponse'][] | null>(null);
  protected readonly isDisabled = signal(false);
  protected onChange?: (it: BackendType['MonitorMinResponse'][] | null) => void;

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
