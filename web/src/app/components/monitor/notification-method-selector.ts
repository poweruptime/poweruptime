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
        {{ 'notificationMethod.selector.selected' | transloco }}
      </label>
      <hlm-combobox-multiple
        [(search)]="searchNotificationMethod"
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
            [placeholder]="'notificationMethod.selector.add' | transloco"
            hlmComboboxChipInput />
        </hlm-combobox-chips>
        <div *hlmComboboxPortal hlmComboboxContent>
          @if (showStatus()) {
            <hlm-combobox-status>
              @if (isPending()) {
                <hlm-spinner />
                Loading...
              } @else if (searchNotificationMethod().length === 0) {
                Type to search Notification methods.
              } @else {
                No matches for "{{ searchNotificationMethod() }}".
              }
            </hlm-combobox-status>
          }
          @if (!isPending()) {
            <hlm-combobox-empty>Try a different search term.</hlm-combobox-empty>
          }
          <div hlmComboboxList>
            @if (notificationMethods(); as value) {
              @for (notificationMethod of value; track notificationMethod.id) {
                <hlm-combobox-item [value]="notificationMethod">
                  {{ notificationMethod.name }}
                </hlm-combobox-item>
              }
            }
          </div>
        </div>
      </hlm-combobox-multiple>
    </div>
  `,
  selector: 'pu-notification-method-selector',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NotificationMethodSelector),
      multi: true,
    },
  ],
  imports: [FormsModule, TranslocoPipe, HlmComboboxImports, HlmSpinnerImports, HlmLabelImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodSelector implements ControlValueAccessor {
  protected itemToString = (method: BackendType['NotificationMethodMinResponse']) => method.name;
  protected isItemEqualToValue = (
    itemValue: BackendType['NotificationMethodMinResponse'],
    selectedValue: BackendType['NotificationMethodMinResponse'] | undefined | null,
  ) => itemValue.id === selectedValue?.id;

  protected readonly showStatus = computed(
    () =>
      this.isPending() ||
      this.searchNotificationMethod().length === 0 ||
      (this.value() && this.value()!.length === 0),
  );

  readonly notificationMethods = input.required<BackendType['NotificationMethodMinResponse'][]>();
  readonly isPending = input.required<boolean>();
  searchNotificationMethod = model('');

  protected readonly value = signal<BackendType['NotificationMethodMinResponse'][] | null>(null);
  protected readonly isDisabled = signal(false);
  protected onChange?: (it: BackendType['NotificationMethodMinResponse'][] | null) => void;

  constructor() {
    effect(() => {
      this.onChange?.(this.value());
    });
  }

  writeValue(it: BackendType['NotificationMethodMinResponse'][]): void {
    this.value.set(it);
  }
  registerOnChange(fn: (it: BackendType['NotificationMethodMinResponse'][] | null) => void): void {
    this.onChange = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  registerOnTouched(_: unknown): void {}
}
