import {
  ChangeDetectionStrategy,
  Component,
  type TemplateRef,
  effect,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';

import {HlmAutocomplete, type HlmAutocompleteOption} from '@spartan-ng/helm/autocomplete';
import type {ClassValue} from 'clsx';

import {HlmMentions} from './hlm-mentions';

@Component({
  selector: 'hlm-mentions-autocomplete',
  imports: [HlmAutocomplete, HlmMentions],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <hlm-autocomplete
      [(mentionFilter)]="mentionFilter"
      [(mentionActive)]="mentionActive"
      [filteredOptions]="filteredOptions()"
      [search]="mentionFilter()"
      [autocompleteInputClass]="autocompleteInputClass()"
      [autocompleteSearchClass]="autocompleteSearchClass()"
      [autocompleteListClass]="autocompleteListClass()"
      [autocompleteItemClass]="autocompleteItemClass()"
      [autocompleteEmptyClass]="autocompleteEmptyClass()"
      [transformOptionToString]="transformOptionToString()"
      [optionTemplate]="optionTemplate()"
      [loading]="loading()"
      [showClearBtn]="false"
      [searchPlaceholderText]="searchPlaceholderText()"
      [loadingText]="loadingText()"
      [emptyText]="emptyText()"
      [disabled]="disabled()"
      [inputId]="inputId()"
      [mentionTriggerChar]="mentionTriggerChar()"
      (valueChange)="_onMentionSelected($event)"
      (searchChange)="_onSearchChange($event)"
      hlmMentions />
  `,
})
export class HlmMentionsAutocomplete<T> {
  private readonly _autocomplete = viewChild.required(HlmAutocomplete<T>);
  private readonly _mentionsDirective = viewChild.required(HlmMentions);

  /** Custom class for the autocomplete search container */
  public readonly autocompleteSearchClass = input<ClassValue>('');

  /** Custom class for the autocomplete input */
  public readonly autocompleteInputClass = input<ClassValue>('');

  /** Custom class for the autocomplete list */
  public readonly autocompleteListClass = input<ClassValue>('');

  /** Custom class for each autocomplete item */
  public readonly autocompleteItemClass = input<ClassValue>('');

  /** Custom class for the empty state */
  public readonly autocompleteEmptyClass = input<ClassValue>('');

  /** The trigger character for mentions */
  public readonly mentionTriggerChar = input<string>('@');

  /** The list of filtered options */
  public readonly filteredOptions = input<T[]>([]);

  /** Function to transform option to display string */
  public readonly transformOptionToString = input<(option: T) => string>((option: T) =>
    typeof option === 'string' ? option : String(option),
  );

  /** Optional template for rendering options */
  public readonly optionTemplate = input<TemplateRef<HlmAutocompleteOption<T>>>();

  /** Whether in loading state */
  public readonly loading = input<boolean>(false);

  /** Placeholder text */
  public readonly searchPlaceholderText = input<string>('Type to search...');

  /** Loading text */
  public readonly loadingText = input<string>('Loading...');

  /** Empty state text */
  public readonly emptyText = input<string>('No results found');

  /** Whether disabled */
  public readonly disabled = input<boolean>(false);

  /** Input ID */
  public readonly inputId = input<string>('');

  /** Current mention filter */
  public readonly mentionFilter = model<string>('');

  /** Whether mention mode is active */
  public readonly mentionActive = model<boolean>(false);

  /** Emitted when a mention is selected */
  public readonly mentionSelected = output<T>();

  /** Emitted when search changes */
  public readonly searchChange = output<string>();

  constructor() {
    // Auto-open autocomplete when mention becomes active
    effect(() => {
      if (this.mentionActive()) {
        // Small delay to ensure autocomplete is ready
        setTimeout(() => {
          const autocomplete = this._autocomplete();
          if (autocomplete && !autocomplete['_brnAutocomplete']().isExpanded()) {
            autocomplete['_brnAutocomplete']().open();
          }
        });
      }
    });
  }

  protected _onMentionSelected(value: T | null): void {
    if (value === null) return;

    const stringValue = this.transformOptionToString()(value);
    this._mentionsDirective().insertMention(stringValue);
    this.mentionSelected.emit(value);
  }

  protected _onSearchChange(search: string): void {
    this.searchChange.emit(search);
  }
}
