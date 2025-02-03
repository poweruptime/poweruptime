import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {Placeholder} from '@app/components';
import {StatusPageEditForm} from '@app/components/status-page';
import {SelectedTeamStore, StatusPageEditStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-8">
      @let _statusPageId = statusPageId();
      @let statusPage = statusPageEditStore.statusPage();
      @if (_statusPageId) {
        @if (statusPageEditStore.isFulfilled()) {
          <h1 class="text-4xl">Edit {{ statusPage?.name }}</h1>
        } @else {
          <pu-placeholder class="h-12 w-64" />
        }
      } @else {
        <h1 class="text-4xl">Create new status page</h1>
      }

      @if (_statusPageId) {
        @if (statusPageEditStore.isFulfilled()) {
          <pu-status-page-edit-form
            class="w-full"
            [statusPage]="statusPage"
            [selectedTeamId]="selectedTeamStore.selectedTeamId()"
            (submitCreate)="statusPageEditStore.create($event)"
            (submitUpdate)="statusPageEditStore.update($event)" />
        } @else {
          <div class="flex animate-pulse justify-between gap-12">
            <div class="flex flex-col gap-3">
              <div class="flex justify-between gap-2">
                <pu-placeholder class="h-14 w-64" />
                <pu-placeholder class="h-14 w-64" />
              </div>

              <pu-placeholder class="flex h-48" />
              <pu-placeholder class="flex h-48" />
            </div>
            <div class="flex flex-col gap-3">
              <pu-placeholder class="flex h-14" />

              <pu-placeholder class="h-96" style="width: 36rem" />
              <pu-placeholder class="h-96" style="width: 36rem" />
              <pu-placeholder class="h-96" style="width: 36rem" />
            </div>
          </div>
        }
      } @else {
        <pu-status-page-edit-form
          [statusPage]="undefined"
          [selectedTeamId]="selectedTeamStore.selectedTeamId()"
          (submitCreate)="statusPageEditStore.create($event)"
          (submitUpdate)="statusPageEditStore.update($event)" />
      }
    </div>
  `,
  selector: 'pu-status-page-edit-page',
  providers: [StatusPageEditStore],
  imports: [StatusPageEditForm, Placeholder],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPageEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly statusPageEditStore = inject(StatusPageEditStore);

  readonly statusPageId = input<string>();

  constructor() {
    this.statusPageEditStore.loadById(this.statusPageId);
  }
}
