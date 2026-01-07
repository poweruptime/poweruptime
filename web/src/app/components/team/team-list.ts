import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {NgIcon} from '@ng-icons/core';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmButtonGroupImports} from '@spartan-ng/helm/button-group';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputImports} from '@spartan-ng/helm/input';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {TeamsStore} from '@app/services';

import {TableFilter} from '../table-filter';
import {TeamTable} from './team-table';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      @let _deleted = showDeleted();

      <div class="flex flex-col items-end justify-between gap-2 md:flex-row md:items-center">
        <div class="flex gap-2">
          <button type="button" hlmBtn variant="default" routerLink="/t/new">
            <ng-icon hlm size="sm" name="lucideBadgePlus" />
            {{ 'team.create.create' | transloco }}
          </button>
          @if (_deleted) {
            <button
              [disabled]="!teamsStore.hasValue() || teamsStore.isPending()"
              (click)="teamsStore.restoreSelection()"
              hlmBtn
              variant="secondary"
              type="button">
              <ng-icon hlm size="sm" name="bootstrapArrowCounterclockwise" />
              {{ 'general.restore' | transloco }}
            </button>
          }
        </div>

        <pu-table-filter filtersKey="filter.">
          <div class="flex justify-end">
            <label class="inline-flex min-w-40 items-center justify-end" hlmLabel for="showDeleted">
              {{ 'general.deleted' | transloco }}
              <hlm-switch class="mr-2" id="showDeleted" [(checked)]="showDeleted" />
            </label>
          </div>

          <div class="w-72" hlmButtonGroup>
            <button type="button" hlmBtn variant="outline">
              <ng-icon hlm name="bootstrapSearch" size="sm" />
            </button>
            <input
              [(ngModel)]="searchFilter"
              [placeholder]="'general.search' | transloco"
              hlmInput />
            @if ((searchFilter()?.length ?? 0) > 0) {
              <button (click)="searchFilter.set('')" type="button" hlmBtn variant="outline">
                <ng-icon hlm name="bootstrapXLg" size="sm" />
                <span class="sr-only">'general.clear' | transloco</span>
              </button>
            }
          </div>
        </pu-table-filter>
      </div>

      <pu-team-table [showDeleted]="showDeleted()" />
    </div>
  `,
  selector: 'pu-team-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TeamsStore],
  imports: [
    NgIcon,
    RouterLink,
    TranslocoPipe,
    FormsModule,
    TeamTable,
    TableFilter,
    HlmButtonImports,
    HlmIconImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmButtonGroupImports,
    HlmInputImports,
  ],
})
export class TeamList {
  readonly teamsStore = inject(TeamsStore);

  searchFilter = linkedQueryParam('filter.name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });

  showDeleted = linkedQueryParam('filter.deleted', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (it) => (it === true ? 'true' : null),
  });

  constructor() {
    this.teamsStore.setName(this.searchFilter);
    this.teamsStore.setDeleted(this.showDeleted);

    this.teamsStore.load(
      computed(() => ({
        name: this.teamsStore.name(),
        deleted: this.teamsStore.deleted(),
        ...this.teamsStore.pageable(),
      })),
    );

    const setColumnsToDisplay = rxMethod<{
      includeSelectColumn: boolean | undefined;
      includeActions: boolean | undefined;
    }>(
      map(({includeSelectColumn, includeActions}) => {
        let it = ['name', 'personalUser.id', 'monitorCount'];

        if (includeSelectColumn) {
          it = ['select', ...it];
        }

        if (includeActions) {
          it.push('actions');
        }

        this.teamsStore.setColumnsToDisplay(it);
      }),
    );

    setColumnsToDisplay(
      computed(() => ({
        includeSelectColumn: this.teamsStore.deleted(),
        includeActions: !this.teamsStore.deleted(),
      })),
    );
  }
}
