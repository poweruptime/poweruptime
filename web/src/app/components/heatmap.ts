import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';

import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';
import {RepeatPipe} from 'ngxtension/repeat-pipe';

import {
  HeatmapDotBackgroundPipe,
  HeatmapDotNumberPipe,
  HeatmapXAxisFormattingPipe,
} from '@app/pipes';

import {BackendType} from '../api';

@Component({
  template: `
    @let _selected = selected();
    <div class="flex flex-row gap-2 overflow-x-auto pt-0.5 pb-8">
      <div class="text-xxs flex flex-col gap-3 pr-2">
        <div class="heatmap-x-axis-label">Mon</div>
        <div class="heatmap-x-axis-label">Tue</div>
        <div class="heatmap-x-axis-label">Wed</div>
        <div class="heatmap-x-axis-label">Thu</div>
        <div class="heatmap-x-axis-label">Fri</div>
        <div class="heatmap-x-axis-label">Sat</div>
        <div class="heatmap-x-axis-label">Sun</div>
      </div>
      @for (entry of entries(); track entry.name; let index = $index) {
        @let _firstWeekNotFull = index === 0 && entry.series.length < 7;
        <div
          class="relative flex flex-col gap-2"
          [class.justify-end]="_firstWeekNotFull"
          [style.margin-bottom]="_firstWeekNotFull ? '1.85rem' : ''">
          @for (day of entry.series; track day.date) {
            @let number = day.value | heatmapDotNumber;
            <hlm-tooltip>
              @if (!_selected || _selected <= number) {
                <div
                  class="heatmap-dot hover:scale-125"
                  [class.animate-pulse]="
                    (day.date | date: 'yyyy-MM-dd') === (currentDate() | date: 'yyyy-MM-dd')
                  "
                  [style.background-color]="number | heatmapDotBackground"
                  hlmTooltipTrigger></div>
              } @else {
                <div
                  class="heatmap-dot border border-solid border-slate-900 hover:scale-125 dark:border-slate-700"
                  hlmTooltipTrigger></div>
              }

              <div class="flex flex-col" *brnTooltipContent>
                <span>{{ day.date | date: 'E, dd.MM.yyyy' }}</span>
                <span class="text-center font-bold">{{ day.value }}</span>
              </div>
            </hlm-tooltip>
          }

          @let xAxis = entry.name | heatmapXAxisFormatting;
          @if (xAxis !== '') {
            <span
              class="absolute left-0"
              [style.bottom]="_firstWeekNotFull ? '-1.68rem' : '-0.75rem'">
              <span class="text-xxs whitespace-nowrap">
                {{ xAxis | date: 'MMM, yy' : 'en-US' }}
              </span>
            </span>
          }
        </div>
      }
      <div class="pl-8">
        <section hlmCard>
          <div class="grid grid-flow-col grid-rows-6 gap-x-4 gap-y-2" hlmCardContent>
            @for (i of 11 | repeat; track i; let first = $first; let last = $last) {
              <div
                class="heatmap-legend-text flex h-3 w-12 items-center justify-between whitespace-nowrap">
                @let number = i + '0' | heatmapDotNumber;
                <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
                <div
                  class="heatmap-dot"
                  [class.scale-125]="_selected === number"
                  [style.background-color]="number | heatmapDotBackground"
                  (keydown)="_selected === number ? selected.set(null) : selected.set(number)"
                  (click)="_selected === number ? selected.set(null) : selected.set(number)"></div>
                @if (first) {
                  <span>0%</span>
                } @else if (last) {
                  <span>100%</span>
                } @else {
                  <span>> {{ i }}0%</span>
                }
              </div>
            }
          </div>
        </section>
      </div>
    </div>
  `,
  styles: `
    @reference "#styles.css";
    .heatmap-x-axis-label {
      @apply h-2 w-6;
    }

    .text-xxs {
      font-size: 0.7rem /* 12px */;
      line-height: 0.9rem /* 16px */;
    }

    .heatmap-dot {
      @apply h-3 w-3 cursor-pointer rounded-sm;
    }

    .heatmap-legend-text {
      font-size: 0.65rem;
      line-height: 0.9rem;
    }
  `,
  selector: 'pu-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    HeatmapDotBackgroundPipe,
    HeatmapXAxisFormattingPipe,
    RepeatPipe,
    HeatmapDotNumberPipe,
    HlmTooltipImports,
    BrnTooltipContentTemplate,
    HlmCardImports,
  ],
})
export class Heatmap {
  currentDate = signal(new Date());

  entries = input.required<BackendType['DayUptimeStatistics'][]>();

  selected = linkedQueryParam('heatmap', {
    parse: paramToNumber(),
    queryParamsHandling: 'merge',
  });
}
