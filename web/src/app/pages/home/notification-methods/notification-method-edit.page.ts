import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {Placeholder} from '@app/components';
import {NotificationMethodEditForm} from '@app/components/notification-method';
import {NotificationMethodEditStore, SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @let _notificationMethodId = notificationMethodId();
      @if (_notificationMethodId) {
        @if (notificationMethodEditStore.isFulfilled()) {
          <h1 class="text-4xl">
            Edit {{ notificationMethodEditStore.notificationMethod()?.name }}
          </h1>
        } @else {
          <pu-placeholder class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">Create new notification method</h1>
      }

      @if (_notificationMethodId) {
        @if (notificationMethodEditStore.isFulfilled()) {
          <pu-notification-method-edit-form
            [notificationMethod]="notificationMethodEditStore.notificationMethod()"
            [selectedTeamId]="selectedTeamStore.selectedTeamId()"
            (submitCreate)="notificationMethodEditStore.create($event)"
            (submitUpdate)="notificationMethodEditStore.update($event)" />
        } @else {
          <!-- Placeholder -->
        }
      } @else {
        <pu-notification-method-edit-form
          [notificationMethod]="undefined"
          [selectedTeamId]="selectedTeamStore.selectedTeamId()"
          (submitCreate)="notificationMethodEditStore.create($event)"
          (submitUpdate)="notificationMethodEditStore.update($event)" />
      }
    </div>
  `,
  selector: 'pu-notification-method-edit-page',
  providers: [NotificationMethodEditStore],
  imports: [NotificationMethodEditForm, Placeholder],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly notificationMethodEditStore = inject(NotificationMethodEditStore);

  readonly notificationMethodId = input<string>();

  constructor() {
    this.notificationMethodEditStore.loadById(this.notificationMethodId);
  }
}
