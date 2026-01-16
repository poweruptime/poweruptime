import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmButtonImports} from '@spartan-ng/helm/button';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmLabelImports} from '@spartan-ng/helm/label';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {HlmSwitchImports} from '@spartan-ng/helm/switch';
import {injectQueryParams} from 'ngxtension/inject-query-params';
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {IsTeamAdmin} from '@app/directives';
import {NotificationMethodsStore, SelectedTeamStore} from '@app/services';
import {arrayToParam, paramToArray} from '@app/util';

import {TableFilter, hasActiveFilters} from '../table-filter';
import {NotificationMethodTable} from './notification-method-table';
import {NotificationMethodsEmpty} from './notification-methods-empty';

@Component({
  template: `
    @if (notificationMethodsStore.isEmpty() && !hasActiveFilters()) {
      <pu-notification-methods-empty />
    } @else {
      <div class="grid gap-2">
        <pu-table-filter>
          <a *isTeamAdmin hlmBtn routerLink="new" head>
            {{ 'notificationMethod.edit.create' | transloco }}
          </a>

          <div class="flex justify-end">
            <label
              class="inline-flex min-w-40 items-center justify-end"
              hlmLabel
              for="showDuplicates">
              {{ 'notificationMethod.edit.useByDefault' | transloco }}
              <hlm-switch class="mr-2" id="showDuplicates" [(checked)]="useByDefaultFilter" />
            </label>
          </div>

          <brn-select
            class="inline-block"
            [(value)]="typesFilter"
            [placeholder]="'general.type' | transloco"
            multiple>
            <hlm-select-trigger>
              <hlm-select-value class="min-w-38" />
            </hlm-select-trigger>
            <hlm-select-content>
              @for (type of types; track type.value) {
                <hlm-option [value]="type.value">{{ type.name }}</hlm-option>
              }
            </hlm-select-content>
          </brn-select>

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

        <pu-notification-method-table />
      </div>
    }
  `,
  selector: 'pu-notification-method-list',
  imports: [
    FormsModule,
    RouterLink,
    TranslocoPipe,
    IsTeamAdmin,
    TableFilter,
    NotificationMethodTable,
    HlmButtonImports,
    HlmIconImports,
    HlmSelectImports,
    BrnSelectImports,
    HlmInputGroupImports,
    HlmLabelImports,
    HlmSwitchImports,
    NotificationMethodsEmpty,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodList {
  protected readonly notificationMethodsStore = inject(NotificationMethodsStore);

  protected readonly hasActiveFilters = injectQueryParams(hasActiveFilters());

  protected readonly searchFilter = linkedQueryParam('filter.name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  protected readonly typesFilter = linkedQueryParam('filter.type', {
    parse: paramToArray<BackendType['NotificationMethodResponse']['data']['_type']>(),
    stringify: arrayToParam(),
  });
  protected readonly useByDefaultFilter = linkedQueryParam('filter.useByDefault', {
    parse: paramToBoolean({defaultValue: false}),
    stringify: (it) => (it === true ? 'true' : null),
  });

  constructor() {
    this.notificationMethodsStore.setSearch(this.searchFilter);
    this.notificationMethodsStore.setTypes(this.typesFilter);
    this.notificationMethodsStore.setUseByDefault(this.useByDefaultFilter);

    const teamId = inject(SelectedTeamStore).selectedTeamId;

    this.notificationMethodsStore.load(
      computed(() => ({
        teamId: teamId(),
        search: this.notificationMethodsStore.search(),
        types: this.notificationMethodsStore.types(),
        useByDefault: this.notificationMethodsStore.useByDefault(),
        ...this.notificationMethodsStore.pageable(),
      })),
    );
  }

  protected readonly types = [
    {value: 'DISCORD' as const, name: 'Discord'},
    {value: 'EMAIL' as const, name: 'Email'},
    {value: 'SLACK' as const, name: 'Slack'},
  ];
}
