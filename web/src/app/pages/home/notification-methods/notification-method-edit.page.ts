import {ChangeDetectionStrategy, Component, computed, inject, input, signal} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';

import {NotificationMethodEditForm} from '@app/components/notification-method';
import {MonitorsSearchStore, NotificationMethodEditStore, SelectedTeamStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-4">
      @let _notificationMethodId = notificationMethodId();
      @if (_notificationMethodId) {
        @if (notificationMethodEditStore.isFulfilled()) {
          <h1 class="text-4xl">
            {{
              'notificationMethod.edit.edit'
                | transloco: notificationMethodEditStore.notificationMethod()
            }}
          </h1>
        } @else {
          <hlm-skeleton class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">{{ 'notificationMethod.edit.create' | transloco }}</h1>
      }

      @if (_notificationMethodId) {
        @if (notificationMethodEditStore.isFulfilled()) {
          <pu-notification-method-edit-form
            [notificationMethod]="notificationMethodEditStore.notificationMethod()"
            [selectedTeamId]="selectedTeamStore.selectedTeamId()"
            [formDisabled]="selectedTeamStore.selectedTeam()?.role === 'MEMBER'"
            [allMonitors]="monitorsStore.entities()"
            [isMonitorsSearchPending]="monitorsStore.isPending()"
            (submitCreate)="notificationMethodEditStore.create($event)"
            (submitUpdate)="notificationMethodEditStore.update($event)" />
        } @else {
          <!-- Placeholder -->
        }
      } @else {
        <pu-notification-method-edit-form
          [notificationMethod]="undefined"
          [selectedTeamId]="selectedTeamStore.selectedTeamId()"
          [allMonitors]="monitorsStore.entities()"
          [isMonitorsSearchPending]="monitorsStore.isPending()"
          (submitCreate)="notificationMethodEditStore.create($event)"
          (submitUpdate)="notificationMethodEditStore.update($event)" />
      }
    </div>
  `,
  selector: 'pu-notification-method-edit-page',
  providers: [NotificationMethodEditStore, MonitorsSearchStore],
  imports: [NotificationMethodEditForm, HlmSkeletonImports, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly notificationMethodEditStore = inject(NotificationMethodEditStore);
  readonly monitorsStore = inject(MonitorsSearchStore);

  readonly notificationMethodId = input<string>();

  searchMonitor = signal('');

  constructor() {
    this.notificationMethodEditStore.loadById(this.notificationMethodId);

    this.monitorsStore.load(
      computed(() => ({
        teamId: this.selectedTeamStore.selectedTeamId(),
        search: this.searchMonitor(),
        page: 0,
        size: 40,
        sort: ['name_asc'],
      })),
    );
  }
}
