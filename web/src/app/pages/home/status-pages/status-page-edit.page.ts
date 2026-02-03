import {ChangeDetectionStrategy, Component, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {HlmTabsImports} from '@spartan-ng/helm/tabs';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {StatusPageEditForm} from '@app/components/status-page';
import {PublicStatusPagePage} from '@app/pages/public/public-status-page.page';
import {SelectedTeamStore, StatusPageEditStore} from '@app/services';

@Component({
  template: `
    <div class="flex flex-col gap-8">
      @let _statusPageId = statusPageId();
      @let statusPage = statusPageEditStore.statusPage();
      @if (!_statusPageId) {
        <h1 class="text-4xl">{{ 'statusPage.edit.create' | transloco }}</h1>
      }

      @if (_statusPageId) {
        @if (statusPageEditStore.isFulfilled()) {
          <hlm-tabs
            class="w-full"
            [tab]="tab()"
            (tabActivated)="
              tab.set($event); $event === 'preview' ? publicStatusPagePage.reload() : undefined
            ">
            <hlm-tabs-list class="h-auto p-0.5" aria-label="Notifications & check results tabs">
              <button class="gap-1.5" type="button" hlmTabsTrigger="edit">
                {{ 'statusPage.edit.edit' | transloco: statusPage }}
              </button>
              <button class="gap-1.5" type="button" hlmTabsTrigger="preview">
                <ng-icon hlm name="lucideEye" size="sm" />
                Preview
              </button>
            </hlm-tabs-list>
            <div hlmTabsContent="edit">
              <div class="overflow-x-hidden">
                <div class="h-8"></div>
                <pu-status-page-edit-form
                  [statusPage]="statusPage"
                  [selectedTeamId]="selectedTeamStore.selectedTeamId()"
                  [formDisabled]="selectedTeamStore.selectedTeam()?.role === 'MEMBER'"
                  (submitCreate)="statusPageEditStore.create($event)"
                  (submitUpdate)="statusPageEditStore.update($event)" />
              </div>
            </div>
            <div hlmTabsContent="preview">
              <div class="px-4 pt-4 sm:container sm:mx-auto" style="max-width: 70rem">
                <pu-public-status-page-page
                  #publicStatusPagePage
                  [statusPageSlug]="statusPage!.slug"
                  preview />
              </div>
            </div>
          </hlm-tabs>
        } @else {
          <div class="flex animate-pulse justify-between gap-12">
            <div class="flex flex-col gap-3">
              <div class="flex justify-between gap-2">
                <hlm-skeleton class="h-14 w-64" />
                <hlm-skeleton class="h-14 w-64" />
              </div>

              <hlm-skeleton class="flex h-48" />
              <hlm-skeleton class="flex h-48" />
            </div>
            <div class="flex flex-col gap-3">
              <hlm-skeleton class="flex h-14" />

              <hlm-skeleton class="h-96" style="width: 36rem" />
              <hlm-skeleton class="h-96" style="width: 36rem" />
              <hlm-skeleton class="h-96" style="width: 36rem" />
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
    PublicStatusPagePage,
    TranslocoPipe,
    HlmSkeletonImports,
    HlmIconImports,
    HlmTabsImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPageEditPage {
  readonly selectedTeamStore = inject(SelectedTeamStore);
  readonly statusPageEditStore = inject(StatusPageEditStore);

  readonly statusPageId = input<string>();

  readonly tab = linkedQueryParam<string>('tab', {
    defaultValue: 'edit',
    queryParamsHandling: 'replace',
  });

  constructor() {
    this.statusPageEditStore.loadById(this.statusPageId);
  }
}
