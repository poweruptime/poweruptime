import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';
import {MatTab, MatTabContent, MatTabGroup} from '@angular/material/tabs';

import {TranslocoPipe} from '@jsverse/transloco';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';

import {Placeholder} from '@app/components';
import {StatusPageEditForm} from '@app/components/status-page';
import {PublicStatusPagePage} from '@app/pages/public/public-status-page.page';
import {SelectedTeamStore, StatusPageEditStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-8">
      @let _statusPageId = statusPageId();
      @let statusPage = statusPageEditStore.statusPage();
      @if (!_statusPageId) {
        <h1 class="text-4xl">{{ 'cmdk.groups.statusPage.create' | transloco }}</h1>
      }

      @if (_statusPageId) {
        @if (statusPageEditStore.isFulfilled()) {
          <mat-tab-group
            [(selectedIndex)]="preview"
            mat-stretch-tabs="false"
            mat-align-tabs="start">
            <mat-tab [label]="'statusPage.edit.edit' | transloco: statusPage">
              <ng-template matTabContent>
                <div class="overflow-x-hidden">
                  <div class="h-8"></div>
                  <pu-status-page-edit-form
                    [statusPage]="statusPage"
                    [selectedTeamId]="selectedTeamStore.selectedTeamId()"
                    (submitCreate)="statusPageEditStore.create($event)"
                    (submitUpdate)="statusPageEditStore.update($event)" />
                </div>
              </ng-template>
            </mat-tab>
            <mat-tab label="Preview">
              <ng-template matTabContent>
                <div class="h-8"></div>
                <pu-public-status-page-page [statusPageSlug]="statusPage!.slug" preview />
              </ng-template>
            </mat-tab>
          </mat-tab-group>
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
  imports: [
    StatusPageEditForm,
    Placeholder,
    TranslocoPipe,
    PublicStatusPagePage,
    MatTabGroup,
    MatTab,
    MatTabContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPageEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly statusPageEditStore = inject(StatusPageEditStore);

  readonly statusPageId = input<string>();

  preview = linkedQueryParam('preview', {
    parse: paramToNumber({defaultValue: 0}),
    stringify: (it) => (it === 0 ? null : it),
  });

  constructor() {
    this.statusPageEditStore.loadById(this.statusPageId);
  }
}
