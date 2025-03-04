import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatOption, MatSelect} from '@angular/material/select';

import {TranslocoPipe} from '@jsverse/transloco';
import {BiComponent} from 'dfx-bootstrap-icons';
import {DfxAutofocus} from 'dfx-helper';

import {BackendType} from '@app/api';

@Component({
  selector: 'pu-monitors-filter',
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
  ],
  template: `
    <div class="flex flex-col rounded-lg border border-solid border-black p-4 dark:border-gray-300">
      @let _searchControl = searchControl();
      <mat-form-field>
        <mat-label>Search</mat-label>
        <input [formControl]="_searchControl" matInput focus />
        @if ((_searchControl.getRawValue()?.length ?? 0) > 0) {
          <button
            class="flex items-center"
            [attr.aria-label]="'general.clear' | transloco"
            (click)="_searchControl.setValue('')"
            matSuffix
            mat-icon-button>
            <bi name="x-lg" aria-hidden="true" />
          </button>
        }
      </mat-form-field>

      @let _statusFilterControl = statusFilterControl();
      <mat-form-field>
        <mat-label>Status</mat-label>
        <mat-select [formControl]="_statusFilterControl" multiple>
          @for (status of availableStatuses(); track status.status) {
            <mat-option [value]="status.status">
              {{ status.name }}
            </mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitorsFilter {
  readonly searchControl = input.required<FormControl<string | null>>();
  readonly statusFilterControl =
    input.required<FormControl<BackendType['MonitorResponse']['status'][] | null>>();

  readonly dashboard = input.required<BackendType['MonitorDashboardResponse'] | undefined>();

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
