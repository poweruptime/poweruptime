import {CdkVirtualScrollViewport, ScrollingModule} from '@angular/cdk/scrolling';
import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
  viewChild,
} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';

import {Subject, throttleTime} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {MtxTooltip} from '@ng-matero/extensions/tooltip';
import {RepeatPipe} from 'ngxtension/repeat-pipe';

import {BackendType} from '@app/api';
import {Placeholder} from '@app/components';
import {MonitorStatusBackground} from '@app/directives';

@Component({
  template: `
    @let _width = width();
    @let _height = height();
    @let _size = size();
    <cdk-virtual-scroll-viewport
      class="uptime-timeline-viewport"
      [class.h-24]="_size === 3"
      [class.h-16]="_size === 2"
      [itemSize]="_size === 3 ? '20' : '16'"
      (scrolledIndexChange)="triggerNextPage()"
      appendOnly="true"
      orientation="horizontal">
      @let _checkResults = checkResults();
      @let length = _checkResults.length;
      @let maxLabelSize = length - 9;
      <div
        *cdkVirtualFor="
          let checkResult of checkResults();
          trackBy: trackById;
          let index = index;
          let first = first;
          let last = last
        ">
        <div
          class="relative inline-flex flex-col items-center gap-1 h-{{ _height }}"
          [style.width]="_size === 3 ? '20px' : '16px'">
          <div
            class="h-{{ _height }} w-{{ _width }} min-w-{{ _width }} rounded hover:scale-125"
            [monitor-status-background]="checkResult.status"
            [mtxTooltip]="checkResultsTooltip"></div>

          <ng-template #checkResultsTooltip>
            <div class="flex flex-col">
              <span>
                {{ checkResult.createdAt | date: 'HH:mm:ss dd.MM. ' }}
              </span>
              <span class="font-bold">{{ checkResult.status }}</span>
            </div>
          </ng-template>

          @if (first) {
            <span class="absolute -bottom-7 left-1">
              {{ 'general.latest' | transloco }}
            </span>
          }

          @if (last) {
            <span class="absolute -bottom-7 right-0">
              {{ checkResult.createdAt | date: 'HH:mm' }}
            </span>
          }

          @if (length > 20 && !first && index % 10 === 0 && index < maxLabelSize) {
            <span class="absolute -bottom-7 left-1">
              {{ checkResult.createdAt | date: 'HH:mm' }}
            </span>
          }
        </div>
      </div>

      @if (isPending()) {
        @for (i of 24 | repeat; track i) {
          <div
            class="relative inline-flex flex-col items-center gap-1"
            [style.width]="_size === 3 ? '20px' : '16px'">
            <pu-placeholder
              class="h-{{ _height }} w-{{ _width }} min-w-{{
                _width
              }} rounded hover:scale-125"></pu-placeholder>
          </div>
        }
      }
    </cdk-virtual-scroll-viewport>

    <!--    <span>&nbsp;</span>-->
  `,
  styles: `
    .uptime-timeline-viewport {
      width: 100%;

      overflow-y: hidden;
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
    }

    .uptime-timeline-viewport .cdk-virtual-scroll-content-wrapper {
      @apply p-1;

      display: flex;
      flex-direction: row;
    }
  `,
  selector: 'pu-uptime-timeline',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MtxTooltip,
    MonitorStatusBackground,
    ScrollingModule,
    TranslocoPipe,
    Placeholder,
    RepeatPipe,
  ],
})
export class UptimeTimeline {
  checkResults = input.required<BackendType['CheckResultMinResponse'][]>();

  isPending = input<boolean>(false);

  size = input<2 | 3>(3);
  width = computed(() => this.size().toString());
  height = computed(() => (this.size() * 3).toString());

  private nextPage$ = new Subject<void>();
  protected nextPage = outputFromObservable(this.nextPage$.pipe(throttleTime(200)));

  private viewport = viewChild.required(CdkVirtualScrollViewport);

  protected triggerNextPage() {
    if (
      this.viewport().measureRenderedContentSize() > 0 &&
      this.viewport().measureScrollOffset('end') !== 0 &&
      this.viewport().measureScrollOffset('end') < 400
    ) {
      this.nextPage$.next();
    }
  }

  protected trackById(_: number, it: {id: unknown}) {
    return it?.id;
  }
}
