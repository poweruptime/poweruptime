import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatPrefix, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

import {distinctUntilChanged, map} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';

import {BackendType, MonitorDataType} from '@app/api';
import {MonitorSearchParams} from '@app/services';

@Component({
  template: `
    <form class="motion-preset-slide-down motion-duration-300 grid gap-2" [formGroup]="form">
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ 'general.search' | transloco }}</mat-label>
        <bi name="search" matIconPrefix />
        <input formControlName="search" matInput focus />
        @if (form.controls.search.getRawValue().length > 0) {
          <button
            class="flex items-center"
            [attr.aria-label]="'general.clear' | transloco"
            (click)="form.controls.search.setValue('')"
            type="button"
            matSuffix
            mat-icon-button>
            <bi name="x-lg" aria-hidden="true" />
          </button>
        }
      </mat-form-field>

      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ 'general.status' | transloco }}</mat-label>
        <bi name="arrow-down-up" matIconPrefix />
        <mat-select formControlName="statuses" multiple>
          @for (status of availableStatuses(); track status.status) {
            <mat-option [value]="status.status">
              {{ status.name }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ 'general.type' | transloco }}</mat-label>
        <bi name="list-check" matIconPrefix />
        <mat-select formControlName="types" multiple>
          @for (type of types; track type.value) {
            <mat-option [value]="type.value">
              {{ type.name }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field subscriptSizing="dynamic">
        <mat-label>{{ 'general.tags' | transloco }}</mat-label>
        <bi name="tag" matIconPrefix />
        <mat-select formControlName="tags" multiple>
          @for (tag of tags(); track tag.name) {
            <mat-option [value]="tag.name">
              {{ tag.name }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </form>
  `,
  selector: 'pu-monitors-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    BiComponent,
    MatFormField,
    MatLabel,
    MatSelect,
    MatOption,
    MatIconButton,
    MatInput,
    DfxAutofocus,
    TranslocoPipe,
    MatPrefix,
    MatSuffix,
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
