import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, booleanAttribute, computed, input} from '@angular/core';

import {NgIcon} from '@ng-icons/core';
import {format} from '@std/fmt/duration';

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
          <ng-icon [monitor-status-color]="'UP'" name="bootstrapCheckCircle"></ng-icon>
        } @else {
          <ng-icon [monitor-status-color]="'DOWN'" name="bootstrapXCircle"></ng-icon>
        }
      } @else {
        <ng-icon name="bootstrapInfoCircle"></ng-icon>
      }
      <div class="flex flex-1 items-center justify-between">
        <span class="font-medium">
          @if (showTimestamps() && _logEntry.createdAt !== '') {
            {{ _logEntry.createdAt | date: 'MM.dd HH:mm:ss.SSSSZ' }} -
          }
          {{ _logEntry.message }}
        </span>

        @if (_logEntry.properties?.['time']) {
          <span class="text-sm text-gray-500 tabular-nums">{{ duration() }}</span>
        } @else if (!disableStartTimestamp()) {
          <pu-relative-time
            class="text-sm text-gray-500 tabular-nums"
            [value]="_logEntry.createdAt"
            format="yyyy.MM.dd HH:mm:ss" />
        }
      </div>
    </div>
  `,
  selector: 'pu-check-result-log-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RelativeTimeWithTooltip, NgIcon, DatePipe, MonitorStatusColor],
})
export class CheckResultLogEntry {
  readonly logEntry = input.required<BackendType['CheckResultLogEntryResponse']>();
  readonly showTimestamps = input.required<boolean>();

  readonly disableStartTimestamp = input(false, {transform: booleanAttribute});

  readonly duration = computed(() =>
    format(Number(this.logEntry().properties?.['time'] ?? 0), {ignoreZero: true}),
  );
}
