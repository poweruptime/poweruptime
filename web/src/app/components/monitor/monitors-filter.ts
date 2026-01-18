import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';

import {distinctUntilChanged, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmSelectImports} from '@spartan-ng/helm/select';

import {BackendType, MonitorDataType} from '@app/api';
import {MonitorSearchParams} from '@app/services';

@Component({
  template: `
    <form class="grid gap-2" [formGroup]="form">
      <div hlmInputGroup>
        <div hlmInputGroupAddon>
          <ng-icon hlm name="bootstrapSearch" size="sm" />
        </div>
        <input
          [placeholder]="'general.search' | transloco"
          formControlName="search"
          hlmInputGroupInput />
        @if (form.controls.search.getRawValue().length > 0) {
          <button (click)="form.controls.search.setValue('')" hlmInputGroupButton type="button">
            <ng-icon hlm name="bootstrapXLg" size="sm" />
            <span class="sr-only">{{ 'general.clear' | transloco }}</span>
          </button>
        }
      </div>

      <brn-select [placeholder]="'general.status' | transloco" formControlName="statuses" multiple>
        <hlm-select-trigger class="w-full">
          <hlm-select-value />
        </hlm-select-trigger>
        <hlm-select-content>
          @for (status of availableStatuses(); track status.status) {
            <hlm-option [value]="status.status">{{ status.name }}</hlm-option>
          }
        </hlm-select-content>
      </brn-select>

      <brn-select [placeholder]="'general.type' | transloco" formControlName="types" multiple>
        <hlm-select-trigger class="w-full">
          <hlm-select-value />
        </hlm-select-trigger>
        <hlm-select-content>
          @for (type of types; track type.value) {
            <hlm-option [value]="type.value">{{ type.name }}</hlm-option>
          }
        </hlm-select-content>
      </brn-select>

      <brn-select [placeholder]="'general.tags' | transloco" formControlName="tags" multiple>
        <hlm-select-trigger class="w-full">
          <hlm-select-value />
        </hlm-select-trigger>
        <hlm-select-content>
          @for (tag of tags(); track tag.name) {
            <hlm-option [value]="tag.name">{{ tag.name }}</hlm-option>
          }
        </hlm-select-content>
      </brn-select>
    </form>
  `,
  selector: 'pu-monitors-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoPipe,
    HlmIconImports,
    HlmInputGroupImports,
    HlmSelectImports,
    BrnSelectImports,
  ],
})
export class MonitorsFilter {
  private readonly fb = inject(NonNullableFormBuilder);
  form = this.fb.group({
    search: [''],
    statuses: this.fb.control<BackendType['MonitorResponse']['status'][]>([]),
    types: this.fb.control<MonitorDataType[]>([]),
    tags: this.fb.control<string[]>([]),
  });

  dashboard = input<BackendType['MonitorDashboardResponse']>();

  tags = input([], {
    transform: (it: BackendType['TagDto'][]) => {
      if (it.length === 0) {
        this.form.controls.tags.disable();
      } else {
        this.form.controls.tags.enable();
      }
      return it;
    },
  });

  filter = input(undefined, {
    transform: (filter?: Partial<MonitorSearchParams>) => {
      if (!filter) {
        return undefined;
      }

      this.form.patchValue({
        ...filter,
        search: filter.search ?? '',
      });

      return filter;
    },
  });

  filterChange = outputFromObservable(
    this.form.valueChanges.pipe(
      map(() => this.form.getRawValue()),
      distinctUntilChanged((_, curr) => JSON.stringify(curr) === JSON.stringify(this.filter())),
    ),
  );

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
