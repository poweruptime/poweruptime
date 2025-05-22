import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, booleanAttribute, computed, input} from '@angular/core';

import {format} from '@std/fmt/duration';
import {BiComponent} from 'dfx-bootstrap-icons';

import {BackendType} from '@app/api';
import {MonitorStatusColor} from '@app/directives';
import {RelativeTimeWithTooltip} from '@app/pipes';

@Component({
  template: `
    @let _logEntry = logEntry();

    <div
      class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-950">
      @if (_logEntry.level === 'ACTION') {
        @let result = _logEntry.properties?.['result'] ?? 'true';
        @if (result === 'true') {
          <bi [monitor-status-color]="'UP'" name="check-circle"></bi>
        } @else {
          <bi [monitor-status-color]="'DOWN'" name="x-circle"></bi>
        }
      } @else {
        <bi name="info-circle"></bi>
      }
      <div class="flex flex-1 items-center justify-between">
        <span class="font-medium">
          @if (showTimestamps() && _logEntry.createdAt !== '') {
            {{ _logEntry.createdAt | date: 'MM.dd HH:mm:ss.SSSSZ' }} -
          }
          {{ _logEntry.message }}
        </span>

        @if (_logEntry.properties?.['time']) {
          <span class="text-sm tabular-nums text-gray-400">{{ duration() }}</span>
        } @else if (!disableStartTimestamp()) {
          <pu-relative-time
            class="text-sm tabular-nums text-gray-400"
            [value]="_logEntry.createdAt"
            format="YYYY.MM.dd HH:mm:ss" />
        }
      </div>
    </div>
  `,
  selector: 'pu-check-result-log-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RelativeTimeWithTooltip, BiComponent, DatePipe, MonitorStatusColor],
})
export class CheckResultLogEntry {
  readonly logEntry = input.required<BackendType['CheckResultLogEntryResponse']>();
  readonly showTimestamps = input.required<boolean>();

  readonly disableStartTimestamp = input(false, {transform: booleanAttribute});

  readonly duration = computed(() =>
    format(Number(this.logEntry().properties?.['time'] ?? 0), {ignoreZero: true}),
  );
}
