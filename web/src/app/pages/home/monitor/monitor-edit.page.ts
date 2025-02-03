import {Component, computed, inject, input, signal} from '@angular/core';

import {Placeholder} from '@app/components';
import {MonitorEditForm, MonitorEditFormPlaceholder} from '@app/components/monitor';
import {MonitorEditStore, NotificationMethodsStore, SelectedTeamStore} from '@app/services';
import {MonitorNotificationMethodsStore} from '@app/services/monitor/monitor-notification-methods.store';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @let _monitorId = monitorId();
      @if (_monitorId) {
        @if (monitorEditStore.isFulfilled()) {
          <h1 class="text-4xl">Edit {{ monitorEditStore.monitor()?.name }}</h1>
        } @else {
          <pu-placeholder class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">Create new monitor</h1>
      }

      @if (!_monitorId || monitorEditStore.isFulfilled()) {
        <pu-monitor-edit-form
          [(searchNotificationMethod)]="searchNotificationMethod"
          [monitor]="monitorEditStore.monitor()"
          [selectedTeamId]="selectedTeamStore.selectedTeamId()"
          [allNotificationMethods]="notificationMethodsStore.entities()"
          [isNotificationMethodsPending]="notificationMethodsStore.isPending()"
          [selectedNotificationMethods]="monitorNotificationMethodsStore.entities()"
          (submitCreate)="monitorEditStore.create($event)"
          (submitUpdate)="monitorEditStore.update($event)" />
      } @else {
        <pu-monitor-edit-form-placeholder />
      }
    </div>
  `,
  selector: 'pu-monitor-edit-page',
  standalone: true,
  providers: [MonitorEditStore, MonitorNotificationMethodsStore, NotificationMethodsStore],
  imports: [MonitorEditForm, MonitorEditFormPlaceholder, Placeholder],
})
export class MonitorEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorEditStore = inject(MonitorEditStore);

  readonly notificationMethodsStore = inject(NotificationMethodsStore);
  readonly monitorNotificationMethodsStore = inject(MonitorNotificationMethodsStore);

  readonly monitorId = input<string>();

  readonly searchNotificationMethod = signal('');

  constructor() {
    this.monitorEditStore.loadMonitorById(this.monitorId);

    this.monitorNotificationMethodsStore.load(this.monitorId);

    this.notificationMethodsStore.setSearch(this.searchNotificationMethod);

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        search: this.notificationMethodsStore.search(),
        types: this.notificationMethodsStore.types(),
        useByDefault: this.notificationMethodsStore.useByDefault(),
        page: 0,
        size: 40,
        sort: ['name,ASC,ignorecase'],
      })),
    );
  }
}
