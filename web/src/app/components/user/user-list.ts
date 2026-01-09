import {ChangeDetectionStrategy, Component, Signal, computed, inject} from '@angular/core';
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
import {linkedQueryParam, paramToBoolean} from 'ngxtension/linked-query-param';

import {BackendType} from '@app/api';
import {UsersStore} from '@app/services';

import {TableFilter} from '../table-filter';
import {UserTable} from './user-table';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex flex-col items-end justify-between gap-2 md:flex-row md:items-center">
        <button type="button" hlmBtn variant="default" routerLink="new">
          <ng-icon hlm size="sm" name="bootstrapPersonFillAdd" />
          {{ 'instanceSettings.inviteUser' | transloco }}
        </button>

        <pu-table-filter>
          <label class="inline-flex min-w-40 items-center justify-end" hlmLabel for="activated">
            {{ 'general.activated' | transloco }}
            <hlm-switch class="ms-2" id="activated" [(checked)]="activatedFilter" />
          </label>

          <brn-select
            class="inline-block"
            [(value)]="roleFilter"
            [placeholder]="'general.role' | transloco">
            <hlm-select-trigger>
              <hlm-select-value class="min-w-38" />
            </hlm-select-trigger>
            <hlm-select-content>
              @for (role of roles; track role.value) {
                <hlm-option [value]="role.value">{{ role.name }}</hlm-option>
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
      </div>

      <pu-user-table />
    </div>
  `,
  selector: 'pu-user-list',
  providers: [UsersStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    TranslocoPipe,
    UserTable,
    TableFilter,
    HlmButtonImports,
    HlmIconImports,
    HlmLabelImports,
    HlmSwitchImports,
    HlmSelectImports,
    BrnSelectImports,
    HlmInputGroupImports,
  ],
})
export class UserList {
  readonly usersStore = inject(UsersStore);

  searchFilter = linkedQueryParam('filter.search', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  roleFilter = linkedQueryParam<BackendType['UserResponse']['role'] | ''>('filter.role', {
    stringify: (value) => ((value?.length ?? 0) > 0 ? value : null),
  });
  activatedFilter = linkedQueryParam('filter.activated', {
    parse: paramToBoolean({defaultValue: true}),
    stringify: (it) => (it === false ? 'false' : null),
  });

  constructor() {
    this.usersStore.setSearch(this.searchFilter);
    this.usersStore.setRole(this.roleFilter as Signal<BackendType['UserResponse']['role']>);
    this.usersStore.setActivated(this.activatedFilter);

    this.usersStore.load(
      computed(() => ({
        search: this.usersStore.search(),
        activated: this.usersStore.activated(),
        role: this.usersStore.role(),
        ...this.usersStore.pageable(),
      })),
    );
  }

  readonly roles = [
    {value: null, name: 'All Roles'},
    {value: 'USER' as const, name: 'User'},
    {value: 'ADMIN' as const, name: 'Admin'},
  ];
}
