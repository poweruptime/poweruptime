import {ChangeDetectionStrategy, Component, computed, inject, input, output} from '@angular/core';
import {MatProgressBar} from '@angular/material/progress-bar';

import {TranslocoPipe} from '@jsverse/transloco';
import {ItemDirective} from '@ngxpert/cmdk';

import {BackendType} from '@app/api';
import {MonitorsSearchStore} from '@app/services';

@Component({
  template: `
    @for (monitor of monitorsSearchStore.entities(); track monitor.id; let index = $index) {
      <button [value]="monitor.id" [filtered]="true" (selected)="selected.emit(monitor)" cmdkItem>
        {{ monitor.name }}
      </button>
    }

    @if (monitorsSearchStore.isPending()) {
      <mat-progress-bar mode="indeterminate" />
    } @else if (monitorsSearchStore.ids().length === 0) {
      <div class="cmdk-empty">{{ 'cmdk.results.empty' | transloco }}</div>
    }
  `,
  selector: 'pu-cmdk-monitor-list',
  providers: [MonitorsSearchStore],
  imports: [ItemDirective, MatProgressBar, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CmdkMonitorList {
  monitorsSearchStore = inject(MonitorsSearchStore);

  searchValue = input.required<string>();
  selected = output<BackendType['MonitorResponse']>();

  constructor() {
    this.monitorsSearchStore.setSearch(this.searchValue);

    this.monitorsSearchStore.load(
      computed(() => ({
        ...this.monitorsSearchStore.pageable(),
        teamId: undefined,
        statuses: [
          'UP' as const,
          'DOWN' as const,
          'MAINTENANCE' as const,
          'PAUSED' as const,
          'PENDING' as const,
        ],
        search: this.monitorsSearchStore.search(),
        types: this.monitorsSearchStore.types(),
      })),
    );
  }
}
