import {Component, computed, inject, input, signal} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {Placeholder} from '@app/components';
import {MonitorEditForm, MonitorEditFormPlaceholder} from '@app/components/monitor';
import {
  DefaultSelectedNotificationMethodsStore,
  MonitorEditStore,
  NotificationMethodsStore,
  SelectedNotificationMethodsForMonitorStore,
  SelectedTeamStore,
} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @let _monitorId = monitorId();
      @if (_monitorId) {
        @if (monitorEditStore.isFulfilled()) {
          <h1 class="text-4xl">
            {{ 'monitor.edit.edit' | transloco: {name: monitorEditStore.monitor()?.name} }}
          </h1>
        } @else {
          <pu-placeholder class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">{{ 'cmdk.groups.monitor.create' | transloco }}</h1>
      }

      @if (!_monitorId || monitorEditStore.isFulfilled()) {
        <pu-monitor-edit-form
          [(searchNotificationMethod)]="searchNotificationMethod"
          [monitor]="monitorEditStore.monitor()"
          [selectedTeamId]="selectedTeamStore.selectedTeamId()"
          [allNotificationMethods]="notificationMethodsStore.entities()"
          [isNotificationMethodsSearchPending]="notificationMethodsStore.isPending()"
          [defaultNotificationMethods]="defaultSelectedNotificationMethodsStore.entities()"
          [isDefaultSelectedNotificationMethodsPending]="
            defaultSelectedNotificationMethodsStore.isPending()
          "
          [selectedNotificationMethods]="selectedNotificationMethodsForMonitorStore.entities()"
          [isSelectedNotificationMethodsPending]="
            selectedNotificationMethodsForMonitorStore.isPending()
          "
          (submitCreate)="monitorEditStore.create($event)"
          (submitUpdate)="monitorEditStore.update($event)" />
      } @else {
        <pu-monitor-edit-form-placeholder />
      }
    </div>
  `,
  selector: 'pu-monitor-edit-page',
  standalone: true,
  providers: [
    MonitorEditStore,
    NotificationMethodsStore,
    SelectedNotificationMethodsForMonitorStore,
    DefaultSelectedNotificationMethodsStore,
  ],
  imports: [MonitorEditForm, MonitorEditFormPlaceholder, Placeholder, TranslocoPipe],
})
export class MonitorEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorEditStore = inject(MonitorEditStore);

  readonly notificationMethodsStore = inject(NotificationMethodsStore);
  readonly selectedNotificationMethodsForMonitorStore = inject(
    SelectedNotificationMethodsForMonitorStore,
  );
  readonly defaultSelectedNotificationMethodsStore = inject(
    DefaultSelectedNotificationMethodsStore,
  );

  readonly monitorId = input<string>();

  searchNotificationMethod = signal('');

  constructor() {
    this.monitorEditStore.loadMonitorById(this.monitorId);

    this.defaultSelectedNotificationMethodsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        page: 0,
        size: 200,
        sort: ['name,ASC,ignorecase'],
        useByDefault: true,
      })),
    );

    this.selectedNotificationMethodsForMonitorStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        usedByMonitorIds: [this.monitorId()!],
        page: 0,
        size: 200,
        sort: ['name,ASC,ignorecase'],
      })),
    );

    this.notificationMethodsStore.setSearch(this.searchNotificationMethod);

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        search: this.notificationMethodsStore.search(),
        page: 0,
        size: 40,
        sort: ['name,ASC,ignorecase'],
      })),
    );
  }
}
