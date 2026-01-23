import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

import {TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {BrnPopoverContent} from '@spartan-ng/brain/popover';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmComboboxImports} from '@spartan-ng/helm/combobox';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSeparatorImports} from '@spartan-ng/helm/separator';

import {BackendType} from '@app/api';

interface DragEventType {
  monitorId: string;
  monitorIds: WritableSignal<string[]>;
}

@Component({
  template: `
    <hlm-separator />
    @let _isDisabled = isDisabled();

    <div class="mt-3 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-xl">{{ 'general.monitors' | transloco }}</span>
        <hlm-combobox
          [(search)]="monitorSearch"
          [formControl]="selectedMonitor"
          (valueChange)="onAdd($event)"
          autoFocus="first-tabbable">
          <hlm-combobox-trigger class="w-44 justify-between font-normal">
            <span hlmComboboxValue></span>
          </hlm-combobox-trigger>
          <div *brnPopoverContent hlmComboboxContent>
            <hlm-combobox-input
              [placeholder]="'general.search' | transloco"
              showTrigger="false"
              mode="popup" />
            <hlm-combobox-empty>
              @if (monitorSearch() === '') {
                {{ 'statusPage.edit.monitors.search.noLeft' | transloco }}
              } @else {
                {{ 'statusPage.edit.monitors.search.noFound' | transloco }}
              }
            </hlm-combobox-empty>
            <div hlmComboboxList>
              @for (monitor of filteredMonitors(); track $index) {
                <hlm-combobox-item [value]="monitor">
                  {{ monitor.name }}
                </hlm-combobox-item>
              }
            </div>
          </div>
        </hlm-combobox>
      </div>

      @let _allMonitors = mappedByIdMonitors();
      @let _monitorIdsWithWriteableSignal = monitorIdsWithWriteableSignal();
      <div
        class="drag-list flex min-h-20 flex-col justify-center gap-2 rounded-xl border border-1 border-dashed border-gray-500"
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
            <section
              [cdkDragData]="monitorIdWithWritableSignal"
              [cdkDragDisabled]="_isDisabled"
              hlmCard
              cdkDrag>
              <div class="monitor-drag-placeholder" *cdkDragPlaceholder></div>
              <div class="flex items-center justify-between text-xl" hlmCardContent>
                <div class="inline-flex items-center gap-2 hover:cursor-move" cdkDragHandle>
                  <ng-icon hlm size="sm" name="bootstrapGripVertical" />
                  <h3>{{ monitor.name }}</h3>
                </div>
                <div>
                  <button
                    [disabled]="_isDisabled"
                    (click)="onDelete(monitorIdWithWritableSignal.monitorId)"
                    hlmBtn
                    variant="ghost"
                    size="icon-sm"
                    type="button">
                    <ng-icon hlm size="sm" name="bootstrapTrashFill" />
                  </button>
                </div>
              </div>
            </section>
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
      @apply animate-pulse rounded-xl bg-slate-400 dark:bg-gray-700;
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
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    TranslocoPipe,
    HlmCardImports,
    HlmComboboxImports,
    BrnPopoverContent,
    HlmButtonImports,
    HlmIconImports,
    HlmSeparatorImports,
  ],
})
export class StatusPageEditFormGroupMonitors implements ControlValueAccessor {
  private readonly translocoService = inject(TranslocoService);

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

  readonly selectedMonitor = new FormControl(
    this.translocoService.translate('statusPage.edit.monitors.add'),
  );
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

  onAdd(it?: BackendType['MonitorResponse'] | string): void {
    if (!it || typeof it === 'string') {
      return;
    }

    const monitorId = it.id;

    const monitor = this.searchableMonitors().find(
      (searchMonitor) => searchMonitor.id === monitorId,
    );

    if (!monitor) {
      throw 'Monitor not found in search monitors';
    }

    this.allSelectedMonitors.update((monitors) => [...monitors, monitor]);
    this.monitorIds.update((monitorIds) => [...monitorIds, monitorId]);

    this.selectedMonitor.reset(this.translocoService.translate('statusPage.edit.monitors.add'));
  }

  onDelete(monitorId: string): void {
    this.monitorIds.update((monitorIds) => {
      const index = monitorIds.findIndex((it) => it === monitorId);
      if (index !== -1) {
        monitorIds.splice(index, 1);
      }
      return [...monitorIds];
    });
    this.allSelectedMonitors.update((monitors) => {
      const index = monitors.findIndex((it) => it.id === monitorId);
      if (index !== -1) {
        monitors.splice(index, 1);
      }
      return [...monitors];
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
