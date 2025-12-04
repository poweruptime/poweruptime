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
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatMenu, MatMenuItem, MatMenuTrigger} from '@angular/material/menu';
import {MatProgressBar} from '@angular/material/progress-bar';

import {LiveAnnouncer} from '@angular/cdk/a11y';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {DfxLowerCaseExceptFirstLettersPipe, StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';

import {Tag} from '../directives';

@Component({
  template: `
    <mat-form-field class="w-full">
      <mat-label>{{ 'tag.selector.selected' | transloco }}</mat-label>
      <mat-chip-grid #chipGrid [attr.aria-label]="'tag.selector.list' | transloco">
        @for (tag of value(); track tag.name) {
          <a [matMenuTriggerFor]="menu" [pu-tag]="tag.variant" (removed)="remove(tag)" mat-chip-row>
            {{ tag.name }}
            <button
              [attr.aria-label]="'tag.selector.remove' | transloco: tag"
              type="button"
              matChipRemove
              stopPropagation>
              <ng-icon name="bootstrapXCircle" aria-hidden="true" />
            </button>
          </a>
          <mat-menu #menu="matMenu">
            @for (tagVariant of tagVariants; track tagVariant) {
              <button (click)="updateTagVariant(tag, tagVariant)" mat-menu-item type="button">
                <!-- i(bootstrapCheckCircleFill, bootstrapCircle) -->
                <ng-icon
                  [name]="
                    tag.variant === tagVariant ? 'bootstrapCheckCircleFill' : 'bootstrapCircle'
                  " />
                <span>
                  {{ tagVariant | s_lowerCaseAllExceptFirstLetter }}
                </span>
              </button>
            }
          </mat-menu>
        }
      </mat-chip-grid>
      <input
        [(ngModel)]="searchTag"
        [matChipInputFor]="chipGrid"
        [matAutocomplete]="auto"
        [placeholder]="'tag.selector.add' | transloco"
        (matChipInputTokenEnd)="add($event)"
        name="searchTags" />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selected($event)">
        @if (isPending()) {
          <mat-progress-bar mode="indeterminate" />
        }
        @for (tag of filteredTags(); track tag.name) {
          <mat-option [value]="tag">{{ tag.name }}</mat-option>
        }
      </mat-autocomplete>
    </mat-form-field>
  `,
  selector: 'pu-tag-selector',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TagSelector),
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
    NgIcon,
    StopPropagationDirective,
    TranslocoPipe,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    DfxLowerCaseExceptFirstLettersPipe,
    Tag,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagSelector implements ControlValueAccessor {
  private readonly announcer = inject(LiveAnnouncer);

  tagVariants: BackendType['TagDto']['variant'][] = [
    'RED' as const,
    'BLUE' as const,
    'GREEN' as const,
    'PINK' as const,
    'YELLOW' as const,
  ];

  tags = input.required<BackendType['TagDto'][]>();
  isPending = input.required<boolean>();
  searchTag = model('');

  readonly filteredTags = computed(() => {
    const selectedTags = this.value()?.map((it) => it.name);
    return this.tags().filter((it) => !selectedTags?.includes(it.name));
  });

  remove(tag: BackendType['TagDto']): void {
    this.value.update((selectedTags) => {
      if (!selectedTags) {
        return null;
      }

      const index = selectedTags.findIndex((it) => it.name === tag.name);
      if (index < 0) {
        return selectedTags;
      }

      selectedTags.splice(index, 1);
      void this.announcer.announce(`Removed ${tag.name}`);
      return [...selectedTags];
    });
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.value.update((selectedTags) => [...(selectedTags ?? []), event.option.value]);
    this.searchTag.set('');
    event.option.deselect();
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value && this.value()?.find((it) => it.name === value) === undefined) {
      this.value.update((selectedTags) => [
        ...(selectedTags ?? []),
        {
          name: value,
          variant: 'BLUE',
        },
      ]);
    }

    // Clear the input value
    this.searchTag.set('');
  }

  updateTagVariant(tag: BackendType['TagDto'], variant: BackendType['TagDto']['variant']) {
    this.value.update((selectedTags) => {
      const index = selectedTags?.findIndex((it) => it.name === tag.name) ?? -1;

      if (index === -1 || !selectedTags) {
        return selectedTags;
      }

      // Tag found. Create a new array with the updated tag at the same index.
      // We create a copy of the tag at 'index' and update its variant.
      const updatedTag = {
        ...selectedTags[index], // Copy all existing properties
        variant: variant, // Overwrite or set the variant property
      };

      // Return a new array with the updated tag replacing the old one.
      // This is a common pattern for immutability in state updates.
      return [
        ...selectedTags.slice(0, index), // Elements before the found index
        updatedTag, // The updated tag
        ...selectedTags.slice(index + 1), // Elements after the found index
      ];
    });
  }

  value = signal<BackendType['TagDto'][] | null>(null);
  isDisabled = signal(false);
  onChange?: (it: BackendType['TagDto'][] | null) => void;

  constructor() {
    effect(() => {
      this.onChange?.(this.value());
    });
  }

  writeValue(it: BackendType['TagDto'][]): void {
    this.value.set(it);
  }
  registerOnChange(fn: (it: BackendType['TagDto'][] | null) => void): void {
    this.onChange = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  registerOnTouched(_: unknown): void {}
}
