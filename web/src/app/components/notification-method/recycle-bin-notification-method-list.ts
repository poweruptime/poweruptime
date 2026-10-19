import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {HlmButtonImports} from '@spartan-ng/helm/button';

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
          <ng-icon class="text-[length:--spacing(4)]" name="bootstrapArrowCounterclockwise" />
          {{ 'general.restore' | transloco }}
        </button>
      </div>

      <pu-recycle-bin-notification-method-table />
    </div>
  `,
  selector: 'pu-recycle-bin-notification-method-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoPipe, RecycleBinNotificationMethodTable, HlmButtonImports, NgIcon],
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
