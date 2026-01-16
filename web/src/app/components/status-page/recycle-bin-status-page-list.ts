import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {StatusPagesStore} from '@app/services';

import {RecycleBinStatusPageTable} from './recycle-bin-status-page-table';

@Component({
  template: `
    <div class="grid gap-2">
      <div>
        <button
          [disabled]="!statusPagesStore.hasValue() || statusPagesStore.isPending()"
          (click)="statusPagesStore.restoreSelection()"
          hlmBtn
          type="button">
          <ng-icon hlm size="sm" name="bootstrapArrowCounterclockwise" />
          {{ 'general.restore' | transloco }}
        </button>
      </div>

      <pu-recycle-bin-status-page-table />
    </div>
  `,
  selector: 'pu-recycle-bin-status-page-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RecycleBinStatusPageTable, TranslocoPipe, HlmButtonImports, HlmIconImports],
  providers: [StatusPagesStore],
})
export class RecycleBinStatusPageList {
  readonly statusPagesStore = inject(StatusPagesStore);

  readonly teamId = input.required<string>();

  constructor() {
    this.statusPagesStore.load(
      computed(() => ({
        teamId: this.teamId(),
        deleted: this.statusPagesStore.deleted(),
        ...this.statusPagesStore.pageable(),
      })),
    );
  }
}
