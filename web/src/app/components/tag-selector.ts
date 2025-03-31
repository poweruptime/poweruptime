import {LiveAnnouncer} from '@angular/cdk/a11y';
import {ChangeDetectionStrategy, Component, inject, input, model} from '@angular/core';
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

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';

@Component({
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ 'tag.selector.selected' | transloco }}</mat-label>
      <mat-chip-grid #chipGrid [attr.aria-label]="'tag.selector.list' | transloco">
        @for (tag of selectedTags(); track tag.id) {
          <a (removed)="remove(tag)" mat-chip-row>
            {{ tag.name }}
            <button
              [attr.aria-label]="'tag.selector.remove' | transloco: tag"
              matChipRemove
              stopPropagation>
              <bi name="x-circle" aria-hidden="true" />
            </button>
          </a>
        }
      </mat-chip-grid>
      <input
        [(ngModel)]="searchTags"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [placeholder]="'tag.selector.add' | transloco"
        name="searchTags" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
        @if (isPending()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @for (notificationMethod of tags(); track notificationMethod.id) {
          <mat-option [value]="notificationMethod">{{ notificationMethod.name }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  selector: 'pu-tag-selector',
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
export class TagSelector {
  readonly tags = input.required<BackendType['NotificationMethodMinResponse'][]>();
  readonly isPending = input.required<boolean>();

  readonly selectedTags = model<BackendType['NotificationMethodMinResponse'][]>([]);
  searchTags = model('');

  readonly announcer = inject(LiveAnnouncer);

  remove(tag: BackendType['NotificationMethodMinResponse']): void {
    this.selectedTags.update((selectedTags) => {
      const index = selectedTags.findIndex((it) => it.id === tag.id);
      if (index < 0) {
        return selectedTags;
      }

      selectedTags.splice(index, 1);
      void this.announcer.announce(`Removed ${tag.name}`);
      return [...selectedTags];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedTags.update((selectedTags) => [...selectedTags, event.option.value]);
    this.searchTags.set('');
    event.option.deselect();
  }
}
