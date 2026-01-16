import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {MonitorsStore} from '@app/services';

import {RecycleBinMonitorTable} from './recycle-bin-monitor-table';

@Component({
  template: `
    <div class="grid gap-2">
      <div>
        <button
          [disabled]="!monitorsStore.hasValue() || monitorsStore.isPending()"
          (click)="monitorsStore.restoreSelection()"
          hlmBtn
          type="button">
          <ng-icon hlm size="sm" name="bootstrapArrowCounterclockwise" />
          {{ 'general.restore' | transloco }}
        </button>
      </div>

      <pu-recycle-bin-monitor-table />
    </div>
  `,
  selector: 'pu-recycle-bin-monitor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MonitorsStore],
  imports: [TranslocoPipe, RecycleBinMonitorTable, HlmButtonImports, HlmIconImports],
})
export class RecycleBinMonitorList {
  readonly monitorsStore = inject(MonitorsStore);

  readonly teamId = input.required<string>();

  constructor() {
    this.monitorsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        deleted: true,
        ...this.monitorsStore.pageable(),
      })),
    );
  }
}
