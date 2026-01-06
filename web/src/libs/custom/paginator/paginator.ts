import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
} from '@angular/core';
import {outputFromObservable, toObservable} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';

import {Subject, combineLatest, map} from 'rxjs';

import {computedPrevious} from '@spartan-ng/brain/core';
import {BrnSelect, BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmLabel} from '@spartan-ng/helm/label';
import {HlmPaginationImports} from '@spartan-ng/helm/pagination';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {hlm} from '@spartan-ng/helm/utils';

// export interface BrnDataTablePaginator {
//   pageIndex: Signal<number>;
//   pageSize: Signal<number>;
//   initialized: Observable<void>;
//   page: EventEmitter<BrnDataTablePageEvent>;
// }

export interface BrnDataTablePageEvent {
  /** The current page index. */
  pageIndex: number;
  /** Index of the page that was selected previously. */
  previousPageIndex: number;
  /** The current page size. */
  pageSize: number;
  /** The current total number of items being paged. */
  length: number;
}

@Component({
  template: `
    <div class="flex justify-end py-0.5">
      <div class="inline-flex items-center justify-between gap-3">
        @if (!hidePageSize()) {
          <div class="flex items-center gap-3">
            @let _displayedPageSizeOptions = displayedPageSizeOptions();
            @if (_displayedPageSizeOptions.length > 1) {
              <label hlmLabel>Rows per page</label>
              <brn-select
                class="ml-auto"
                [(ngModel)]="pageSize"
                (ngModelChange)="changePageSize()"
                placeholder="Page size">
                <hlm-select-trigger class="w-fit">
                  <hlm-select-value />
                </hlm-select-trigger>
                <hlm-select-content>
                  @for (pageSize of _displayedPageSizeOptions; track pageSize) {
                    <hlm-option [value]="pageSize">{{ pageSize }}</hlm-option>
                  }
                </hlm-select-content>
              </brn-select>
            } @else {
              <span class="text-sm">{{ pageSize() }} Rows per page</span>
            }
          </div>
        }
        <p
          class="text-muted-foreground flex grow justify-end gap-1 text-sm whitespace-nowrap"
          aria-live="polite">
          @let rangeLabel = computedRangeLabel();
          <span class="text-foreground">{{ rangeLabel.startIndex }}-{{ rangeLabel.endIndex }}</span>
          <span>of</span>
          <span class="text-foreground">{{ rangeLabel.length }}</span>
        </p>
        <div class="grow">
          <nav hlmPagination>
            <ul hlmPaginationContent>
              @let _showFirstLastButtons = showFirstLastButtons();
              @if (_showFirstLastButtons) {
                <li [class]="computedPreviousClass()" hlmPaginationItem>
                  <button (click)="firstPage()" hlmBtn size="icon" variant="ghost">
                    <ng-icon hlm size="sm" name="lucideChevronFirst" />
                  </button>
                </li>
              }
              <li [class]="computedPreviousClass()" hlmPaginationItem>
                <button (click)="previousPage()" hlmBtn size="icon" variant="ghost">
                  <ng-icon hlm size="sm" name="lucideChevronLeft" />
                </button>
              </li>
              <li [class]="computedNextClass()" hlmPaginationItem>
                <button (click)="nextPage()" hlmBtn size="icon" variant="ghost">
                  <ng-icon hlm size="sm" name="lucideChevronRight" />
                </button>
              </li>
              @if (_showFirstLastButtons) {
                <li [class]="computedNextClass()" hlmPaginationItem>
                  <button (click)="lastPage()" hlmBtn size="icon" variant="ghost">
                    <ng-icon hlm size="sm" name="lucideChevronLast" />
                  </button>
                </li>
              }
            </ul>
          </nav>
        </div>
      </div>
    </div>
  `,
  selector: 'hlm-paginator',
  imports: [
    BrnSelectImports,
    HlmButtonImports,
    HlmPaginationImports,
    HlmSelectImports,
    HlmIconImports,
    FormsModule,
    HlmLabel,
    BrnSelect,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HlmPaginator {
  /** Event emitted when the paginator changes the page size or page index. */
  private readonly _page$ = new Subject<BrnDataTablePageEvent>();

  /** Whether to hide the page size selection UI from the user. */
  readonly hidePageSize = input(false, {transform: booleanAttribute});

  /** Whether to show the first/last buttons UI to the user. */
  readonly showFirstLastButtons = input(false, {transform: booleanAttribute});

  readonly pageSizeOptions = input<number[]>([5, 10, 20, 50, 100]);

  readonly _pageSize = input(5, {
    transform: (it: number | null | undefined) => Math.max(it ?? 0, 0),
    alias: 'pageSize',
  });
  readonly pageSize = linkedSignal(this._pageSize);

  readonly _pageIndex = input(0, {
    transform: (it: number | null | undefined) => Math.max(it ?? 0, 0),
    alias: 'pageIndex',
  });
  readonly pageIndex = linkedSignal(this._pageIndex);
  private readonly previousPageIndex = computedPrevious(this.pageIndex);

  readonly length = input(0, {
    transform: (it: number | null | undefined) => Math.max(it ?? 0, 0),
  });

  readonly page$ = this._page$.asObservable();
  readonly page = outputFromObservable(this._page$);

  private readonly numberOfPages = computed(() => {
    if (!this.pageSize()) {
      return 0;
    }

    return Math.ceil(this.length() / this.pageSize());
  });

  private readonly hasPreviousPage = computed(() => this.pageIndex() >= 1 && this.pageSize() !== 0);

  private readonly hasNextPage = computed(() => {
    const maxPageIndex = this.numberOfPages() - 1;
    return this.pageIndex() < maxPageIndex && this.pageSize() !== 0;
  });

  protected readonly displayedPageSizeOptions = computed(() => {
    // If no page size is provided, use the first page size option or the default page size.
    const pageSize = this.pageSize() !== 0 ? this.pageSize() : this.pageSizeOptions()[0];

    let displayedPageSizeOptions = this.pageSizeOptions().slice();

    if (displayedPageSizeOptions.indexOf(pageSize) === -1) {
      displayedPageSizeOptions.push(pageSize);
    }

    displayedPageSizeOptions.sort((a, b) => a - b);

    return displayedPageSizeOptions;
  });

  protected readonly computedPreviousClass = computed(() => {
    const isDisabled = !this.hasPreviousPage();
    return hlm(isDisabled ? 'opacity-50 pointer-events-none' : '');
  });
  protected readonly computedNextClass = computed(() => {
    const isDisabled = !this.hasNextPage();
    return hlm(isDisabled ? 'opacity-50 pointer-events-none' : '');
  });

  /** A label for the range of items within the current page and the length of the whole list. */
  protected readonly computedRangeLabel = computed(() => {
    const pageSize = this.pageSize();
    let length = this.length();
    if (length == 0 || pageSize == 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        length,
      };
    }

    length = Math.max(length, 0);

    const startIndex = this.pageIndex() * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex =
      startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;

    return {
      startIndex: startIndex + 1,
      endIndex,
      length,
    };
  });

  protected changePageSize(): void {
    // Current page needs to be updated to reflect the new page size. Navigate to the page
    // containing the previous page's first item.
    const startIndex = this.pageIndex() * this.pageSize();

    this.pageIndex.set(Math.floor(startIndex / this.pageSize()) ?? 0);
    this.emitPageEvent();
  }

  /** Advances to the next page if it exists. */
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.pageIndex.update((pageIndex) => pageIndex + 1);
    this.emitPageEvent();
  }

  /** Move back to the previous page if it exists. */
  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }

    this.pageIndex.update((pageIndex) => pageIndex - 1);
    this.emitPageEvent();
  }

  /** Move to the first page if not already there. */
  firstPage(): void {
    // hasPreviousPage being false implies at the start
    if (!this.hasPreviousPage()) {
      return;
    }

    this.pageIndex.set(0);
    this.emitPageEvent();
  }

  /** Move to the last page if not already there. */
  lastPage(): void {
    // hasNextPage being false implies at the end
    if (!this.hasNextPage()) {
      return;
    }

    this.pageIndex.set(this.numberOfPages() - 1);
    this.emitPageEvent();
  }

  protected emitPageEvent() {
    this._page$.next({
      previousPageIndex: this.previousPageIndex(),
      pageIndex: this.pageIndex(),
      pageSize: this.pageSize(),
      length: this.length(),
    });
  }
}
