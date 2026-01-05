import {Component, computed, inject, input, signal} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

import {MonitorEditForm, MonitorEditFormPlaceholder} from '@app/components/monitor';
import {
  DefaultSelectedNotificationMethodsStore,
  MonitorEditStore,
  NotificationMethodsStore,
  SelectedTeamStore,
  TagsStore,
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
          <hlm-skeleton class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">{{ 'cmdk.groups.monitor.create' | transloco }}</h1>
      }

      @if (!_monitorId || monitorEditStore.isFulfilled()) {
        <pu-monitor-edit-form
          [(searchNotificationMethod)]="searchNotificationMethod"
          [(searchTag)]="searchTag"
          [monitor]="monitorEditStore.monitor()"
          [selectedTeamId]="selectedTeamStore.selectedTeamId()"
          [allNotificationMethods]="notificationMethodsStore.entities()"
          [isNotificationMethodsSearchPending]="notificationMethodsStore.isPending()"
          [defaultNotificationMethods]="defaultSelectedNotificationMethodsStore.entities()"
          [isDefaultSelectedNotificationMethodsPending]="
            defaultSelectedNotificationMethodsStore.isPending()
          "
          [allTags]="tagsStore.entities()"
          [isTagsSearchPending]="tagsStore.isPending()"
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
    DefaultSelectedNotificationMethodsStore,
    TagsStore,
  ],
  imports: [MonitorEditForm, MonitorEditFormPlaceholder, HlmSkeletonImports, TranslocoPipe],
})
export class MonitorEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly monitorEditStore = inject(MonitorEditStore);

  readonly notificationMethodsStore = inject(NotificationMethodsStore);
  readonly defaultSelectedNotificationMethodsStore = inject(
    DefaultSelectedNotificationMethodsStore,
  );

  readonly tagsStore = inject(TagsStore);

  readonly monitorId = input<string>();

  searchNotificationMethod = signal('');
  searchTag = signal('');

  constructor() {
    this.monitorEditStore.loadMonitorById(this.monitorId);

    this.defaultSelectedNotificationMethodsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        page: 0,
        size: 200,
        sort: ['name_asc'],
        useByDefault: true,
      })),
    );

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        search: this.searchNotificationMethod(),
        page: 0,
        size: 40,
        sort: ['name_asc'],
      })),
    );

    this.tagsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        name: this.searchTag(),
      })),
    );
  }
}
