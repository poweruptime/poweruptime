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

import {BackendType} from '@app/api';

@Component({
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ 'notificationMethod.selector.selected' | transloco }}</mat-label>
      <mat-chip-grid #chipGrid [attr.aria-label]="'notificationMethod.selector.list' | transloco">
        @for (notificationMethod of value(); track notificationMethod.id) {
          <a (removed)="remove(notificationMethod)" mat-chip-row>
            {{ notificationMethod.name }}
            <button
              [attr.aria-label]="
                'notificationMethod.selector.remove' | transloco: notificationMethod
              "
              type="button"
              matChipRemove
              stopPropagation>
              <bi name="x-circle" aria-hidden="true" />
            </button>
          </a>
        }
      </mat-chip-grid>
      <input
        [(ngModel)]="searchNotificationMethod"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [placeholder]="'notificationMethod.selector.add' | transloco"
        name="searchNotificationMethod" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
        @if (isPending()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @for (notificationMethod of filteredNotificationMethods(); track notificationMethod.id) {
          <mat-option [value]="notificationMethod">{{ notificationMethod.name }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  selector: 'pu-notification-method-selector',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NotificationMethodSelector),
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
export class NotificationMethodSelector implements ControlValueAccessor {
  readonly announcer = inject(LiveAnnouncer);

  notificationMethods = input.required<BackendType['NotificationMethodMinResponse'][]>();
  isPending = input.required<boolean>();
  searchNotificationMethod = model('');

  readonly filteredNotificationMethods = computed(() => {
    const selectedNotificationMethods = this.value()?.map((it) => it.id);
    return this.notificationMethods().filter((it) => !selectedNotificationMethods?.includes(it.id));
  });

  remove(notificationMethod: BackendType['NotificationMethodMinResponse']): void {
    this.value.update((selectedNotificationMethods) => {
      if (!selectedNotificationMethods) {
        return null;
      }

      const index = selectedNotificationMethods.findIndex((it) => it.id === notificationMethod.id);
      if (index < 0) {
        return selectedNotificationMethods;
      }

      selectedNotificationMethods.splice(index, 1);
      void this.announcer.announce(`Removed ${notificationMethod.name}`);
      return [...selectedNotificationMethods];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.value.update((notificationMethods) => [
      ...(notificationMethods ?? []),
      event.option.value,
    ]);
    this.searchNotificationMethod.set('');
    event.option.deselect();
  }

  value = signal<BackendType['NotificationMethodMinResponse'][] | null>(null);
  isDisabled = signal(false);
  onChange?: (it: BackendType['NotificationMethodMinResponse'][] | null) => void;

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
