import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, input, signal} from '@angular/core';

import {MtxTooltip} from '@ng-matero/extensions/tooltip';
import {DfxTimeLeftPipe} from 'dfx-helper';

import {BackendType} from '@app/api';

@Component({
  template: `
    @let _width = width();
    @let _height = height();
    @let _checkResultsSize = checkResultsSize();

    <div
      class="flex min-w-full flex-grow flex-row-reverse gap-2 overflow-x-auto p-2 pb-3"
      id="overflow-container">
      @for (
        checkResult of checkResults();
        track checkResult.id;
        let first = $first;
        let last = $last;
        let index = $index
      ) {
        <div class="relative flex flex-col items-center">
          <div
            class="h-{{ _height }} w-{{ _width }} min-w-{{ _width }} rounded hover:scale-125"
            [class.bg-green-500]="checkResult.status === 'UP'"
            [class.bg-red-500]="checkResult.status === 'DOWN'"
            [class.bg-orange-500]="checkResult.status === 'PENDING'"
            [class.bg-blue-500]="
              checkResult.status === 'PAUSED' || checkResult.status === 'MAINTENANCE'
            "
            [mtxTooltip]="checkResultsTooltip"></div>

          <ng-template #checkResultsTooltip>
            <div class="flex flex-col">
              <span>
                {{ checkResult.createdAt | date: 'HH:mm:ss dd.MM. ' }}
              </span>
              <span class="font-bold">{{ checkResult.status }}</span>
            </div>
          </ng-template>

          @if (last && _checkResultsSize > 10) {
            <span class="absolute -bottom-2 left-0 whitespace-nowrap">
              {{ checkResult.createdAt | date: 'HH:mm' }}
              @if (_checkResultsSize > 20) {
                <span class="text-xs">
                  ({{ checkResult.createdAt | d_timeLeft: currentDate() }} ago)
                </span>
              }
            </span>
          }
          @if (first) {
            <span class="absolute -bottom-2 right-0 whitespace-nowrap">Latest</span>
          }
          @if (
            _checkResultsSize > 20 &&
            index % 10 === 0 &&
            index > 3 &&
            index < checkResults().length - 9
          ) {
            <span class="absolute -bottom-2 right-0 whitespace-nowrap">
              {{ checkResult.createdAt | date: 'HH:mm' }}
            </span>
          }

          <span>&nbsp;</span>
        </div>
      }
    </div>

    <div style="display: none">
      <span class="w-2"></span>
      <span class="w-3"></span>
      <span class="h-6"></span>
      <span class="h-9"></span>
    </div>
  `,
  styles: `
    #overflow-container {
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
    }
  `,
  selector: 'pu-uptime-timeline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DfxTimeLeftPipe, MtxTooltip],
})
export class UptimeTimeline {
  currentDate = signal(new Date());

  checkResults = input.required<BackendType['CheckResultMinResponse'][]>();

  checkResultsSize = computed(() => this.checkResults()?.length);

  size = input<2 | 3>(3);
  width = computed(() => this.size().toString());
  height = computed(() => (this.size() * 3).toString());
}
