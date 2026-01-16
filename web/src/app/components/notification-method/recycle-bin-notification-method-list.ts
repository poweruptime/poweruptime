import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {NotificationMethodsStore} from '@app/services';

import {RecycleBinNotificationMethodTable} from './recycle-bin-notification-method-table';

@Component({
  template: `
    <div class="grid gap-2">
      <div>
        <button
          [disabled]="!notificationMethodsStore.hasValue() || notificationMethodsStore.isPending()"
          (click)="notificationMethodsStore.restoreSelection()"
          hlmBtn
          type="button">
          <ng-icon hlm size="sm" name="bootstrapArrowCounterclockwise" />
          {{ 'general.restore' | transloco }}
        </button>
      </div>

      <pu-recycle-bin-notification-method-table />
    </div>
  `,
  selector: 'pu-recycle-bin-notification-method-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, RecycleBinNotificationMethodTable, HlmButtonImports, HlmIconImports],
  providers: [NotificationMethodsStore],
})
export class RecycleBinNotificationMethodPage {
  readonly notificationMethodsStore = inject(NotificationMethodsStore);

  readonly teamId = input.required<string>();

  constructor() {
    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: this.teamId(),
        deleted: this.notificationMethodsStore.deleted(),
        ...this.notificationMethodsStore.pageable(),
      })),
    );
  }
}
