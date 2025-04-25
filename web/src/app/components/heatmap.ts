import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';
import {MatCard, MatCardContent} from '@angular/material/card';

import {MtxTooltip} from '@ng-matero/extensions/tooltip';
import {RepeatPipe} from 'ngxtension/repeat-pipe';

import {HeatmapDotBackgroundPipe, HeatmapXAxisFormattingPipe} from '@app/pipes';

import {BackendType} from '../api';

@Component({
  template: `
    <div class="flex flex-row gap-2 overflow-x-auto pb-8 pt-0.5">
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
          [style.margin-bottom]="_firstWeekNotFull ? '0.9rem' : ''">
          @for (day of entry.series; track day.date) {
            <div
              class="heatmap-dot"
              [class.animate-pulse]="
                (day.date | date: 'YYYY-MM-dd') === (currentDate() | date: 'YYYY-MM-dd')
              "
              [style.background-color]="day.value | heatmapDotBackground"
              [mtxTooltip]="heatmapDotTooltip"
              mtxTooltipPosition="above"></div>

            <ng-template #heatmapDotTooltip>
              <div class="flex flex-col">
                <span>{{ day.date | date: 'E, dd.MM.YYYY' }}</span>
                <span class="font-bold">{{ day.value }}</span>
              </div>
            </ng-template>
          }

          @let xAxis = entry.name | heatmapXAxisFormatting;
          @if (xAxis !== '') {
            <span
              class="absolute left-0"
              [style.bottom]="_firstWeekNotFull ? '-1.68rem' : '-0.75rem'">
              <span class="text-xxs whitespace-nowrap">
                {{ xAxis | date: 'MMM, YY' : 'en-US' }}
              </span>
            </span>
          }
        </div>
      }
      <div class="pl-8">
        <mat-card appearance="outlined">
          <mat-card-content>
            <div class="grid grid-flow-col grid-rows-6 gap-x-4 gap-y-2">
              @for (i of 11 | repeat; track i; let first = $first; let last = $last) {
                <div
                  class="heatmap-legend-text flex h-3 w-12 items-center justify-between whitespace-nowrap">
                  <div
                    class="heatmap-dot"
                    [style.background-color]="i + '0' | heatmapDotBackground"></div>
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
          </mat-card-content>
        </mat-card>
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
      @apply h-3 w-3 cursor-pointer rounded-sm hover:scale-125;
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
    MtxTooltip,
    MatCard,
    MatCardContent,
  ],
})
export class Heatmap {
  currentDate = signal(new Date());

  entries = input.required<BackendType['DayUptimeStatistics'][]>();
}
