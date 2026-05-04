import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';

import {distinctUntilChanged, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import '@spartan-ng/brain/select';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmInputGroupImports} from '@spartan-ng/helm/input-group';
import {HlmSelectImports} from '@spartan-ng/helm/select';

import {BackendType, MonitorDataType} from '@app/api';
import {MonitorSearchParams} from '@app/services';
import {SlicePipe, TitleCasePipe} from '@angular/common';

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

      <hlm-select-multiple formControlName="statuses">
        <hlm-select-trigger class="w-full">
          <hlm-select-placeholder>{{ 'general.status' | transloco }}</hlm-select-placeholder>
          <ng-template hlmSelectValues let-values>
            <hlm-select-values-content>
              @for (value of values | slice: 0 : 2; track value) {
                <!-- For whatever reason any is needed here! Makes no sense.. -->
                {{ $any(value) | titlecase }}{{ !$last ? ',' : '' }}
              }
              @if (values.length > 2) {
                (+{{ values.length - 2 }} more)
              }
            </hlm-select-values-content>
          </ng-template>
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-group>
            @for (status of availableStatuses(); track status.status) {
              <hlm-select-item [value]="status.status">{{ status.name }}</hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select-multiple>

      <hlm-select-multiple formControlName="types">
        <hlm-select-trigger class="w-full">
          <hlm-select-placeholder>{{ 'general.type' | transloco }}</hlm-select-placeholder>
          <ng-template hlmSelectValues let-values>
            <hlm-select-values-content>
              @for (value of values | slice: 0 : 2; track value) {
                {{ value }}{{ !$last ? ',' : '' }}
              }
              @if (values.length > 2) {
                (+{{ values.length - 2 }} more)
              }
            </hlm-select-values-content>
          </ng-template>
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-group>
            @for (type of types; track type.value) {
              <hlm-select-item [value]="type.value">{{ type.name }}</hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select-multiple>

      <hlm-select-multiple formControlName="tags">
        <hlm-select-trigger class="w-full">
          <hlm-select-placeholder>{{ 'general.tags' | transloco }}</hlm-select-placeholder>
          <ng-template hlmSelectValues let-values>
            <hlm-select-values-content>
              @for (value of values | slice: 0 : 2; track value) {
                {{ value }}{{ !$last ? ',' : '' }}
              }
              @if (values.length > 2) {
                (+{{ values.length - 2 }} more)
              }
            </hlm-select-values-content>
          </ng-template>
        </hlm-select-trigger>
        <hlm-select-content *hlmSelectPortal>
          <hlm-select-group>
            @for (tag of tags(); track tag.name) {
              <hlm-select-item [value]="tag.name">{{ tag.name }}</hlm-select-item>
            }
          </hlm-select-group>
        </hlm-select-content>
      </hlm-select-multiple>
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
    TitleCasePipe,
    SlicePipe,
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
