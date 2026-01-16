import {Component, booleanAttribute, computed, inject, input, signal} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

import {MonitorEditForm, MonitorEditFormPlaceholder} from '@app/components/monitor';
import {
  DefaultSelectedNotificationMethodsStore,
  MonitorDetailStore,
  MonitorEditStore,
  NotificationMethodsStore,
  SelectedTeamStore,
  TagsStore,
} from '@app/services';

@Component({
  template: `
    @let _isEditing = isEditing();
    <div class="flex flex-col gap-4">
      @if (!_isEditing) {
        <h1 class="text-3xl">{{ 'monitor.edit.create' | transloco }}</h1>
      }

      @if (monitorDetailStore.isFulfilled() || !_isEditing) {
        <pu-monitor-edit-form
          class="mt-4"
          [(searchNotificationMethod)]="searchNotificationMethod"
          [(searchTag)]="searchTag"
          [monitor]="monitorDetailStore.monitor()"
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
        <hlm-skeleton class="h-12 w-64" />

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
  protected readonly selectedTeamStore = inject(SelectedTeamStore);
  protected readonly monitorEditStore = inject(MonitorEditStore);
  protected readonly monitorDetailStore = inject(MonitorDetailStore);

  readonly notificationMethodsStore = inject(NotificationMethodsStore);
  readonly defaultSelectedNotificationMethodsStore = inject(
    DefaultSelectedNotificationMethodsStore,
  );

  isEditing = input(false, {transform: booleanAttribute});

  readonly tagsStore = inject(TagsStore);

  searchNotificationMethod = signal('');
  searchTag = signal('');

  constructor() {
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
