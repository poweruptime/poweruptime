import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
  viewChild,
} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';

import {CdkVirtualScrollViewport, ScrollingModule} from '@angular/cdk/scrolling';

import {Subject, throttleTime} from 'rxjs';

import {HlmSkeletonImports} from '@spartan-ng/helm/skeleton';
import {RepeatPipe} from 'ngxtension/repeat-pipe';

import {BackendType} from '@app/api';

import {UptimeTimelineEntry} from './uptime-timeline-entry';

@Component({
  template: `
    @let _size = size();
    @let _link = link();
    @let _hideLabel = hideLabel();
    <cdk-virtual-scroll-viewport
      class="uptime-timeline-viewport"
      [class.h-24]="_size === 3 && !_hideLabel"
      [class.h-16]="(_size === 2 && !_hideLabel) || (_size === 3 && _hideLabel)"
      [class.h-10]="_size === 2 && _hideLabel"
      [itemSize]="_size === 3 ? '18' : '14'"
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
        <pu-uptime-timeline-entry
          [checkResult]="checkResult"
          [first]="first"
          [hideLabel]="_hideLabel"
          [index]="index"
          [last]="last"
          [length]="length"
          [link]="_link"
          [maxLabelSize]="maxLabelSize"
          [size]="_size" />
      </div>

      @if (isPending()) {
        @for (i of 24 | repeat; track i) {
          <div
            class="relative inline-flex flex-col items-center gap-1"
            [style.width]="_size === 3 ? '20px' : '16px'">
            <hlm-skeleton
              class="rounded-sm hover:scale-125"
              [class.h-9]="_size === 3"
              [class.h-6]="_size === 2"
              [class.w-3]="_size === 3"
              [class.w-2]="_size === 2" />
          </div>
        }
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: `
    @reference "#styles.css";

    .uptime-timeline-viewport {
      width: 100%;

      overflow-y: hidden;
      scroll-snap-type: y mandatory;
      scroll-behavior: smooth;
    }

    .uptime-timeline-viewport .cdk-virtual-scroll-content-wrapper {
      @apply p-1;
      min-width: 5rem;

      display: flex;
      flex-direction: row;
    }
  `,
  selector: 'pu-infinite-uptime-timeline',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, HlmSkeletonImports, RepeatPipe, UptimeTimelineEntry],
})
export class InfiniteUptimeTimeline {
  checkResults = input.required<BackendType['CheckResultMinResponse'][]>();

  isPending = input<boolean>(false);

  size = input<2 | 3>(3);

  link = input(false, {transform: booleanAttribute});
  hideLabel = input(false, {transform: booleanAttribute});

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
