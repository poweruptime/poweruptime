/**
 * @license
 * Original work Copyright Google LLC All Rights Reserved.
 * Modified work Copyright DatePoll-Systems
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {
  Directive,
  EventEmitter,
  InjectionToken,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  booleanAttribute,
  inject,
} from '@angular/core';

import {Observable, ReplaySubject, Subject} from 'rxjs';

import {SortDirection} from './sort-direction';
import {
  getSortDuplicateSortableIdError,
  getSortHeaderMissingIdError,
  getSortInvalidDirectionError,
} from './sort-errors';

/** Position of the arrow that displays when sorted. */
export type SortHeaderArrowPosition = 'before' | 'after';

/** Interface for a directive that holds sorting state consumed by `HlmSortHeader`. */
export interface HlmSortable {
  /** The id of the column being sorted. */
  id: string;

  /** Starting sort direction. */
  start: SortDirection;

  /** Whether to disable clearing the sorting state. */
  disableClear: boolean;
}

/** The current sort state. */
export interface Sort {
  /** The id of the column being sorted. */
  active: string;

  /** The sort direction. */
  direction: SortDirection;
}

/** Default options for `hlm-sort`.  */
export interface HlmSortDefaultOptions {
  /** Whether to disable clearing the sorting state. */
  disableClear?: boolean;
  /** Position of the arrow that displays when sorted. */
  arrowPosition?: SortHeaderArrowPosition;
}

/** Injection token to be used to override the default options for `hlm-sort`. */
export const HLM_SORT_DEFAULT_OPTIONS = new InjectionToken<HlmSortDefaultOptions>(
  'HLM_SORT_DEFAULT_OPTIONS',
);

/** Container for HlmSortable to manage the sort state and provide default sort parameters. */
@Directive({
  selector: '[hlmSort]',
  exportAs: 'hlmSort',
  host: {class: 'hlm-sort'},
})
export class HlmSort implements OnChanges, OnDestroy, OnInit {
  private _initializedStream = new ReplaySubject<void>(1);

  /** Collection of all registered sortables that this directive manages. */
  sortables = new Map<string, HlmSortable>();

  /** Used to notify any child components listening to state changes. */
  readonly _stateChanges = new Subject<void>();

  /** The id of the most recently sorted HlmSortable. */
  @Input({alias: 'hlmSortActive'}) active = '';

  /**
   * The direction to set when an HlmSortable is initially sorted.
   * May be overridden by the HlmSortable's sort start.
   */
  @Input('hlmSortStart') start: SortDirection = 'asc';

  /** The sort direction of the currently active HlmSortable. */
  @Input('hlmSortDirection')
  get direction(): SortDirection {
    return this._direction;
  }
  set direction(direction: SortDirection) {
    if (
      direction &&
      direction !== 'asc' &&
      direction !== 'desc' &&
      (typeof ngDevMode === 'undefined' || ngDevMode)
    ) {
      throw getSortInvalidDirectionError(direction);
    }
    this._direction = direction;
  }
  private _direction: SortDirection = '';

  /**
   * Whether to disable the user from clearing the sort by finishing the sort direction cycle.
   * May be overridden by the HlmSortable's disable clear input.
   */
  @Input({alias: 'hlmSortDisableClear', transform: booleanAttribute})
  disableClear = false;

  /** Whether the sortable is disabled. */
  @Input({alias: 'hlmSortDisabled', transform: booleanAttribute})
  disabled = false;

  /** Event emitted when the user changes either the active sort or sort direction. */
  @Output('hlmSortChange') readonly sortChange: EventEmitter<Sort> = new EventEmitter<Sort>();

  /** Emits when the paginator is initialized. */
  initialized: Observable<void> = this._initializedStream;

  private _defaultOptions: HlmSortDefaultOptions | null = inject(HLM_SORT_DEFAULT_OPTIONS, {
    optional: true,
  });

  /**
   * Register function to be used by the contained HlmSortables. Adds the HlmSortable to the
   * collection of HlmSortables.
   */
  register(sortable: HlmSortable): void {
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (!sortable.id) {
        throw getSortHeaderMissingIdError();
      }

      if (this.sortables.has(sortable.id)) {
        throw getSortDuplicateSortableIdError(sortable.id);
      }
    }

    this.sortables.set(sortable.id, sortable);
  }

  /**
   * Unregister function to be used by the contained HlmSortable. Removes the HlmSortable from the
   * collection of contained HlmSortable.
   */
  deregister(sortable: HlmSortable): void {
    this.sortables.delete(sortable.id);
  }

  /** Sets the active sort id and determines the new sort direction. */
  sort(sortable: HlmSortable): void {
    if (this.active != sortable.id) {
      this.active = sortable.id;
      this.direction = sortable.start ?? this.start;
    } else {
      this.direction = this.getNextSortDirection(sortable);
    }

    this.sortChange.emit({active: this.active, direction: this.direction});
  }

  /** Returns the next sort direction of the active sortable, checking for potential overrides. */
  getNextSortDirection(sortable: HlmSortable): SortDirection {
    if (!sortable) {
      return '';
    }

    // Get the sort direction cycle with the potential sortable overrides.
    const disableClear =
      sortable?.disableClear ?? this.disableClear ?? !!this._defaultOptions?.disableClear;
    const sortDirectionCycle = getSortDirectionCycle(sortable.start || this.start, disableClear);

    // Get and return the next direction in the cycle
    let nextDirectionIndex = sortDirectionCycle.indexOf(this.direction) + 1;
    if (nextDirectionIndex >= sortDirectionCycle.length) {
      nextDirectionIndex = 0;
    }
    return sortDirectionCycle[nextDirectionIndex];
  }

  ngOnInit(): void {
    this._initializedStream.next();
  }

  ngOnChanges(): void {
    this._stateChanges.next();
  }

  ngOnDestroy(): void {
    this._stateChanges.complete();
  }
}

/** Returns the sort direction cycle to use given the provided parameters of order and clear. */
function getSortDirectionCycle(start: SortDirection, disableClear: boolean): SortDirection[] {
  const sortOrder: SortDirection[] = ['asc', 'desc'];
  if (start == 'desc') {
    sortOrder.reverse();
  }
  if (!disableClear) {
    sortOrder.push('');
  }

  return sortOrder;
}
