import {LiveAnnouncer} from '@angular/cdk/a11y';
import {ChangeDetectionStrategy, Component, inject, input, model, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import {MatChipGrid, MatChipInput, MatChipRemove, MatChipRow} from '@angular/material/chips';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatProgressBar} from '@angular/material/progress-bar';
import {RouterLink} from '@angular/router';

import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';

@Component({
  template: `
    <form>
      <mat-form-field class="w-full">
        <mat-label>Notification methods</mat-label>
        <mat-chip-grid #chipGrid aria-label="Fruit selection">
          @for (notificationMethod of selectedNotificationMethods(); track notificationMethod.id) {
            <a
              [routerLink]="'../../../notification-methods/' + notificationMethod.id"
              (removed)="remove(notificationMethod)"
              mat-chip-row>
              {{ notificationMethod.name }}
              <button
                [attr.aria-label]="'remove ' + notificationMethod.name"
                matChipRemove
                stopPropagation>
                <bi name="x-circle" />
              </button>
            </a>
          }
        </mat-chip-grid>
        <input
          [(ngModel)]="searchNotificationMethod"
          [matChipInputFor]="chipGrid"
          [matAutocomplete]="auto"
          name="searchNotificationMethod"
          placeholder="Add notification methods..." />
        <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
          @if (isPending()) {
            <mat-progress-bar mode="indeterminate" />
          }
          @for (notificationMethod of notificationMethods(); track notificationMethod.id) {
            <mat-option [value]="notificationMethod">{{ notificationMethod.name }}</mat-option>
          }
        </mat-autocomplete>
      </mat-form-field>
    </form>
  `,
  selector: 'pu-notification-method-selector',
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
    RouterLink,
    StopPropagationDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodSelector {
  readonly notificationMethods = input.required<BackendType['NotificationMethodMinResponse'][]>();
  readonly isPending = input.required<boolean>();

  readonly selectedNotificationMethods = model<BackendType['NotificationMethodMinResponse'][]>([]);
  readonly searchNotificationMethod = model('');

  readonly autoComplete = viewChild.required(MatAutocomplete);

  readonly announcer = inject(LiveAnnouncer);

  remove(notificationMethod: BackendType['NotificationMethodMinResponse']): void {
    this.selectedNotificationMethods.update((selectedNotificationMethods) => {
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
    this.selectedNotificationMethods.update((notificationMethods) => [
      ...notificationMethods,
      event.option.value,
    ]);
    this.searchNotificationMethod.set('');
    event.option.deselect();
  }
}
