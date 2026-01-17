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
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

import {map, timer} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnPopoverContent} from '@spartan-ng/brain/popover';
import {HlmComboboxImports} from '@spartan-ng/helm/combobox';

import {GroupedTimezones} from '@app/services';

@Component({
  template: `
    <hlm-combobox [(value)]="value">
      <hlm-combobox-input [placeholder]="'general.timezone' | transloco"></hlm-combobox-input>
      <div *brnPopoverContent hlmComboboxContent>
        <hlm-combobox-empty>No items found.</hlm-combobox-empty>
        <div hlmComboboxList>
          @for (timezoneGroup of availableTimezones(); track $index) {
            <div hlmComboboxGroup>
              <div hlmComboboxLabel>{{ timezoneGroup.region }}</div>
              @for (timezone of timezoneGroup.timezones; track timezone.id) {
                <hlm-combobox-item [value]="timezone.id">
                  {{ timezone.label }}
                  <span class="text-xs text-gray-500 dark:text-gray-300">
                    ({{ timezone.offset }})
                  </span>
                </hlm-combobox-item>
              }
              <div hlmComboboxSeparator></div>
            </div>
          }
        </div>
      </div>
    </hlm-combobox>

    <div class="mt-2">
      <span>{{ 'general.time' | transloco }}:</span>
      {{ nowInTimezone() | date: 'yyyy.MM.dd HH:mm:ss' }}
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
  imports: [FormsModule, TranslocoPipe, DatePipe, HlmComboboxImports, BrnPopoverContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneInput implements ControlValueAccessor {
  availableTimezones = input([], {transform: (it: GroupedTimezones[] | undefined) => it ?? []});

  value = signal<string | null>('');
  isDisabled = signal(false);
  onChange?: (it: string | null) => void;

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
