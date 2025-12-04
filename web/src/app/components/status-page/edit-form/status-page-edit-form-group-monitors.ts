import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  computed,
  effect,
  forwardRef,
  input,
  model,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

import {MatIconButton} from '@angular/material/button';
import {MatCard, MatCardContent} from '@angular/material/card';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatProgressBar} from '@angular/material/progress-bar';
import {MatOption, MatSelect, MatSelectChange} from '@angular/material/select';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {NgxMatSelectSearchModule} from 'ngx-mat-select-search';

import {BackendType} from '@app/api';

interface DragEventType {
  monitorId: string;
  monitorIds: WritableSignal<string[]>;
}

@Component({
  template: `
    <hr />
    @let _isDisabled = isDisabled();

    <div class="mt-3 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xl">{{ 'general.monitors' | transloco }}</span>
        <mat-form-field subscriptSizing="dynamic">
          <mat-label>{{ 'statusPage.edit.monitors.add' | transloco }}</mat-label>
          <mat-select [formControl]="selectedMonitor" (selectionChange)="onAdd($event)">
            <mat-option class="pt-1">
              <ngx-mat-select-search [(ngModel)]="monitorSearch" noEntriesFoundLabel="">
                <ng-icon name="bootstrapXLg" ngxMatSelectSearchClear />
              </ngx-mat-select-search>
            </mat-option>
            @if (monitorSearchPending()) {
              <mat-progress-bar mode="indeterminate" style="z-index: 1000; margin-top: 0.5rem" />
            } @else {
              @for (monitor of filteredMonitors(); track monitor.id) {
                <mat-option [value]="monitor.id">{{ monitor.name }}</mat-option>
              } @empty {
                <mat-option disabled>
                  @if (monitorSearch() === '') {
                    {{ 'statusPage.edit.monitors.search.noLeft' | transloco }}
                  } @else {
                    {{ 'statusPage.edit.monitors.search.noFound' | transloco }}
                  }
                </mat-option>
              }
            }
          </mat-select>
        </mat-form-field>
      </div>

      @let _allMonitors = mappedByIdMonitors();
      @let _monitorIdsWithWriteableSignal = monitorIdsWithWriteableSignal();
      <div
        class="drag-list flex min-h-20 flex-col justify-center gap-2 rounded-lg border border-1 border-dashed border-gray-500"
        [id]="'list-spgm-' + index()"
        [cdkDropListData]="_monitorIdsWithWriteableSignal"
        [cdkDropListEnterPredicate]="alreadyInListPredicate()"
        [cdkDropListConnectedTo]="length()"
        (cdkDropListDropped)="onMonitorDrop($event)"
        cdkDropList>
        @for (
          monitorIdWithWritableSignal of _monitorIdsWithWriteableSignal;
          track monitorIdWithWritableSignal.monitorId
        ) {
          @let monitor = _allMonitors.get(monitorIdWithWritableSignal.monitorId);

          @if (monitor; as monitor) {
            <mat-card
              [cdkDragData]="monitorIdWithWritableSignal"
              [cdkDragDisabled]="_isDisabled"
              cdkDrag>
              <div class="monitor-drag-placeholder" *cdkDragPlaceholder></div>
              <mat-card-content>
                <div class="flex items-center justify-between text-xl">
                  <div class="inline-flex items-center gap-2 hover:cursor-move" cdkDragHandle>
                    <ng-icon name="bootstrapGripVertical" size="20" />
                    <h3>{{ monitor.name }}</h3>
                  </div>
                  <div>
                    <button
                      [disabled]="_isDisabled"
                      (click)="onDelete(monitorIdWithWritableSignal.monitorId)"
                      type="button"
                      mat-icon-button>
                      <ng-icon name="bootstrapTrashFill" />
                    </button>
                  </div>
                </div>
              </mat-card-content>
            </mat-card>
          } @else {
            <div>NEVER EVER ERROR</div>
          }
        } @empty {
          <span class="my-4 text-center">{{ 'statusPage.edit.monitors.empty' | transloco }}</span>
        }
      </div>
    </div>
  `,
  styles: `
    @reference "#styles.css";

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drag-list.cdk-drop-list-dragging mat-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .monitor-drag-placeholder {
      @apply animate-pulse rounded-2xl bg-slate-400 dark:bg-gray-700;
      min-height: 4.5rem;
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `,
  selector: 'pu-status-page-edit-form-group-monitors',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StatusPageEditFormGroupMonitors),
      multi: true,
    },
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatIconButton,
    MatCard,
    MatCardContent,
    MatFormField,
    MatSelect,
    MatLabel,
    MatOption,
    NgxMatSelectSearchModule,
    NgIcon,
    MatProgressBar,
    CdkDragPlaceholder,
    TranslocoPipe,
  ],
})
export class StatusPageEditFormGroupMonitors implements ControlValueAccessor {
  monitorSearch = model.required<string>();
  monitorSearchPending = input.required<boolean>();
  allSelectedMonitors = model.required<BackendType['MonitorMinResponse'][]>();
  searchableMonitors = input.required<BackendType['MonitorResponse'][]>();

  index = input.required<number>();
  length = input.required({
    transform: (length: number) => Array.from({length}, (_, i) => `list-spgm-${i}`),
  });

  readonly mappedByIdMonitors = computed(() =>
    this.allSelectedMonitors().reduce(
      (acc, item) => acc.set(item.id, item),
      new Map<string, BackendType['MonitorMinResponse']>(),
    ),
  );
  readonly filteredMonitors = computed(() => {
    const monitorIds = this.monitorIds();
    const mappedMonitors = this.mappedByIdMonitors();
    return this.searchableMonitors().filter(
      ({id}) => !monitorIds.includes(id) && !mappedMonitors.has(id),
    );
  });

  readonly alreadyInListPredicate = computed(
    () => (item: CdkDrag<string>) => this.monitorIds().find((it) => it === item.data) === undefined,
  );

  readonly monitorIds = signal<string[]>([]);
  readonly monitorIdsWithWriteableSignal = computed(() =>
    this.monitorIds().map((it) => ({monitorId: it, monitorIds: this.monitorIds})),
  );

  readonly selectedMonitor = new FormControl('');
  readonly isDisabled = signal(false);
  onChange?: (it: string[] | null) => void;

  constructor() {
    effect(() => {
      this.onChange?.(this.monitorIds());
    });
  }

  writeValue(it: string[] | null): void {
    this.monitorIds.set(it ?? []);
  }
  registerOnChange(fn: (it: string[] | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(): void {}
  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
    if (isDisabled) {
      this.selectedMonitor.disable();
    } else {
      this.selectedMonitor.enable();
    }
  }

  onAdd(it: MatSelectChange): void {
    const monitor = this.searchableMonitors().find(
      (searchMonitor) => searchMonitor.id === it.value,
    );

    if (!monitor) {
      throw 'Monitor not found in search monitors';
    }

    this.allSelectedMonitors.update((monitors) => [...monitors, monitor]);
    this.monitorIds.update((monitorIds) => [...monitorIds, it.value]);

    this.selectedMonitor.reset();
  }

  onDelete(monitorId: string): void {
    this.monitorIds.update((monitorIds) => {
      const index = monitorIds.findIndex((it) => it === monitorId);
      if (index !== -1) {
        monitorIds.splice(index, 1);
      }
      return [...monitorIds];
    });
  }

  onMonitorDrop(event: CdkDragDrop<DragEventType[]>): void {
    if (event.previousContainer.id === event.container.id) {
      this.monitorIds.update((monitorIds) => {
        moveItemInArray(monitorIds, event.previousIndex, event.currentIndex);
        return [...monitorIds];
      });

      return;
    }
    const monitorIdWithStore = event.item.data as DragEventType;

    const previousData = event.previousContainer.data.slice();
    const currentData = event.container.data.slice();

    transferArrayItem(previousData, currentData, event.previousIndex, event.currentIndex);

    this.monitorIds.set(currentData.map((it) => it.monitorId));
    monitorIdWithStore.monitorIds.set(previousData.map((it) => it.monitorId));
  }
}
