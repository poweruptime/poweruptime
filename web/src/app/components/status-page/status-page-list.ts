import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {TableFilter, hasActiveFilters} from '@app/components/table-filter';
import {IsTeamAdmin} from '@app/directives';
import {SelectedTeamStore, StatusPagesStore} from '@app/services';

import {StatusPageTable} from './status-page-table';
import {StatusPagesEmpty} from './status-pages-empty';

@Component({
  template: `
    @if (statusPagesStore.isEmpty() && !hasActiveFilters()) {
      <pu-status-pages-empty />
    } @else {
      <div class="grid gap-2">
        <div class="flex justify-between gap-4">
          <a *isTeamAdmin hlmBtn routerLink="new">
            {{ 'cmdk.groups.statusPage.create' | transloco }}
          </a>

          <pu-table-filter>
            <div class="w-72" hlmInputGroup>
              <div hlmInputGroupAddon>
                <ng-icon hlm name="bootstrapSearch" size="sm" />
              </div>
              <input
                [(ngModel)]="searchFilter"
                [placeholder]="'general.search' | transloco"
                hlmInputGroupInput />
              @if ((searchFilter()?.length ?? 0) > 0) {
                <button (click)="searchFilter.set('')" hlmInputGroupButton type="button">
                  <ng-icon hlm name="bootstrapXLg" size="sm" />
                  <span class="sr-only">{{ 'general.clear' | transloco }}</span>
                </button>
              }
            </div>
          </pu-table-filter>
        </div>

        <pu-status-page-table />
      </div>
    }
  `,
  selector: 'pu-status-page-list',
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    IsTeamAdmin,
    TableFilter,
    StatusPageTable,
    HlmButtonImports,
    HlmIconImports,
    HlmInputGroupImports,
    StatusPagesEmpty,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusPageList {
  protected readonly statusPagesStore = inject(StatusPagesStore);

  protected readonly hasActiveFilters = injectQueryParams(hasActiveFilters());

  searchFilter = linkedQueryParam('filter.name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });

  constructor() {
    this.statusPagesStore.setSearch(this.searchFilter);

    const teamId = inject(SelectedTeamStore).selectedTeamId;

    this.statusPagesStore.load(
      computed(() => ({
        teamId: teamId(),
        search: this.statusPagesStore.search(),
        ...this.statusPagesStore.pageable(),
      })),
    );
  }
}
