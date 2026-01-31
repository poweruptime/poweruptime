import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {RouterLink} from '@angular/router';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {StopPropagationDirective} from 'dfx-helper';

import {BackendType} from '@app/api';
import {MonitorStatusBackground} from '@app/directives';

@Component({
  template: `
    @let _checkResult = checkResult();
    @let _size = size();

    <div
      class="relative inline-flex flex-col items-center"
      [class.h-9]="_size === 3"
      [class.h-6]="_size === 2"
      [style.width]="_size === 3 ? '18px' : '14px'"
      [style.min-width]="_size === 3 ? '18px' : '14px'">
      @if (link()) {
        <hlm-tooltip>
          <a
            class="rounded-sm hover:scale-125"
            [routerLink]="'c/' + _checkResult.id + '/logs'"
            [class.h-9]="_size === 3"
            [class.h-6]="_size === 2"
            [class.w-3]="_size === 3"
            [class.w-2]="_size === 2"
            [monitor-status-background]="_checkResult.status"
            hlmTooltipTrigger
            stopPropagation>
            <span class="sr-only">{{ _checkResult.status }}</span>
          </a>

          <div class="flex flex-col" *brnTooltipContent>
            <span>
              {{ _checkResult.createdAt | date: 'HH:mm:ss dd.MM. ' }}
            </span>
            <span class="text-center font-bold">{{ _checkResult.status }}</span>
          </div>
        </hlm-tooltip>
      } @else {
        <hlm-tooltip>
          <div
            class="rounded-sm hover:scale-125"
            [class.h-9]="_size === 3"
            [class.h-6]="_size === 2"
            [class.w-3]="_size === 3"
            [class.w-2]="_size === 2"
            [monitor-status-background]="_checkResult.status"
            hlmTooltipTrigger></div>

          <div class="flex flex-col" *brnTooltipContent>
            <span>
              {{ _checkResult.createdAt | date: 'HH:mm:ss dd.MM. ' }}
            </span>
            <span class="text-center font-bold">{{ _checkResult.status }}</span>
          </div>
        </hlm-tooltip>
      }

      @if (!hideLabel()) {
        @let _first = first();
        @let _last = last();
        @let _index = index();
        @let _length = length();

        @if (_first) {
          <span class="text-muted-foreground absolute -bottom-9 left-1">
            {{ 'general.latest' | transloco }}
          </span>
        }

        @if (_last && _length > 10) {
          <span class="text-muted-foreground absolute right-0 -bottom-9">
            {{ _checkResult.createdAt | date: 'HH:mm' }}
          </span>
        }

        @if (_length > 22 && !_first && _index % 10 === 0 && _index < maxLabelSize()) {
          <span class="text-muted-foreground absolute -bottom-9 left-1">
            {{ _checkResult.createdAt | date: 'HH:mm' }}
          </span>
        }
      }
    </div>
  `,
  selector: 'pu-uptime-timeline-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MonitorStatusBackground,
    DatePipe,
    TranslocoPipe,
    StopPropagationDirective,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
  ],
})
export class UptimeTimelineEntry {
  size = input.required<2 | 3>();

  checkResult = input.required<BackendType['CheckResultMinResponse']>();

  index = input.required<number>();
  maxLabelSize = input.required<number>();
  first = input.required<boolean>();
  last = input.required<boolean>();
  length = input.required<number>();

  link = input.required<boolean>();
  hideLabel = input.required<boolean>();
}
