import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {linkedQueryParam} from 'ngxtension/linked-query-param';

import {LastCheckResultsStore, MonitorsStore} from '@app/services';

import {BackendType, MonitorDataType} from '../../api';
import {arrayToParam, paramToArray} from '../../util';
import {TableFilter} from '../table-filter';
import {MonitorTable} from './monitor-table';

@Component({
  template: `
    <div class="grid gap-2">
      <pu-table-filter>
        <h2 class="text-xl" head>{{ 'general.monitors' | transloco }}</h2>

        <div class="w-full" hlmInputGroup>
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

        <hlm-select-multiple [(value)]="statusesFilter">
          <hlm-select-trigger class="w-full">
            <hlm-select-value [placeholder]="'general.status' | transloco" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              @for (status of availableStatuses(); track status.status) {
                <hlm-select-item [value]="status.status">{{ status.name }}</hlm-select-item>
              }
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select-multiple>

        <hlm-select-multiple [(value)]="typesFilter">
          <hlm-select-trigger class="w-full">
            <hlm-select-value [placeholder]="'general.type' | transloco" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              @for (type of types; track type.value) {
                <hlm-select-item [value]="type.value">{{ type.name }}</hlm-select-item>
              }
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select-multiple>

        <hlm-select-multiple [(value)]="tagsFilter" [disabled]="tags().length === 0">
          <hlm-select-trigger class="w-full">
            <hlm-select-value [placeholder]="'general.tags' | transloco" />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-group>
              @for (tag of tags(); track tag.name) {
                <hlm-select-item [value]="tag.name">{{ tag.name }}</hlm-select-item>
              }
            </hlm-select-group>
          </hlm-select-content>
        </hlm-select-multiple>
      </pu-table-filter>

      <pu-monitor-table [teamId]="teamId()" />
    </div>
  `,
  selector: 'pu-monitor-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MonitorTable,
    TableFilter,
    FormsModule,
    TranslocoPipe,
    HlmInputGroupImports,
    HlmIconImports,
    HlmSelectImports,
  ],
})
export class MonitorList {
  readonly monitorsStore = inject(MonitorsStore);
  protected readonly checkResultsStore = inject(LastCheckResultsStore);

  readonly teamId = input<string>();
  readonly dashboard = input<BackendType['MonitorDashboardResponse']>();

  readonly tags = input<BackendType['TagDto'][]>([]);

  protected searchFilter = linkedQueryParam('filter.name', {
    stringify: (value) => (value.length > 0 ? value : null),
  });
  protected statusesFilter = linkedQueryParam('filter.status', {
    parse: paramToArray<BackendType['MonitorResponse']['status']>(),
    stringify: arrayToParam(),
  });
  protected typesFilter = linkedQueryParam('filter.type', {
    parse: paramToArray<MonitorDataType>(),
    stringify: arrayToParam(),
  });
  protected tagsFilter = linkedQueryParam('filter.tag', {
    parse: paramToArray<string>(),
    stringify: arrayToParam(),
  });

  constructor() {
    this.monitorsStore.load(
      computed(() => ({
        ...this.monitorsStore.pageable(),
        teamId: this.teamId(),
        search: this.searchFilter() ?? undefined,
        statuses: this.statusesFilter() ?? undefined,
        types: this.typesFilter() ?? undefined,
        tags: this.tagsFilter() ?? undefined,
        sort: ['status_asc', 'name_asc'],
      })),
    );

    this.checkResultsStore.loadAll(
      computed(() => this.monitorsStore.entities().map((it) => it.id)),
    );
  }
  readonly types = [
    {value: 'DNS', name: 'DNS'},
    {value: 'HTTP', name: 'HTTP'},
    {value: 'PING', name: 'Ping'},
    {value: 'PUSH', name: 'Push'},
    {value: 'SSL_CERTIFICATE', name: 'SSL Certificate'},
  ];

  readonly availableStatuses = computed(() => {
    const dashboard = this.dashboard();
    if (!dashboard) {
      return [
        {status: 'UP' as const, name: 'Up'},
        {status: 'DOWN' as const, name: 'Down'},
        {status: 'MAINTENANCE' as const, name: 'Maintenance'},
        {status: 'PAUSED' as const, name: 'Paused'},
      ];
    }

    return [
      {status: 'UP' as const, name: `Up (${dashboard.upCount})`},
      {status: 'DOWN' as const, name: `Down (${dashboard.downCount})`},
      {
        status: 'MAINTENANCE' as const,
        name: `Maintenance (${dashboard.maintenanceCount})`,
      },
      {status: 'PAUSED' as const, name: `Paused (${dashboard.pausedCount})`},
    ];
  });
}
