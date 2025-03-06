import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import {ChangeDetectionStrategy, Component, input, viewChild} from '@angular/core';
import {outputFromObservable} from '@angular/core/rxjs-interop';

import {Subject, throttleTime} from 'rxjs';

import {TranslocoPipe} from '@jsverse/transloco';
import {RepeatPipe} from 'ngxtension/repeat-pipe';

import type {BackendType} from '@app/api';
import {Placeholder} from '@app/components';

import {MonitorCard} from './monitor-card';

@Component({
  template: `
    <cdk-virtual-scroll-viewport
      (scrolledIndexChange)="triggerNextPage()"
      minBufferPx="1500"
      maxBufferPx="1500"
      itemSize="150">
      <pu-monitor-card
        *cdkVirtualFor="let monitor of entities(); trackBy: trackById"
        [monitor]="monitor" />

      @if (isPending()) {
        @for (i of 8 | repeat; track i) {
          <div style="height: 150px">
            <a
              class="flex animate-pulse flex-col items-start space-y-4 rounded-lg border border-solid border-black p-4 dark:border-gray-500"
              style="height: 140px">
              <div class="grid grid-cols-3 gap-6">
                <pu-placeholder class="col-span-8 h-5" />
              </div>
              <pu-placeholder class="h-12 w-full" />
            </a>
          </div>
        }
      } @else if (entities().length === 0) {
        <span>{{ 'monitor.empty' | transloco }}</span>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: `
    cdk-virtual-scroll-viewport {
      height: 90vh;
      overflow-x: hidden;

      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */

      &::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Edge */
      }

      pu-monitor-card {
        display: block;
        height: 150px;
      }
    }
  `,
  selector: 'pu-monitor-card-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MonitorCard,
    RepeatPipe,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    Placeholder,
    TranslocoPipe,
  ],
})
export class MonitorCardList {
  entities = input.required<BackendType['MonitorResponse'][]>();

  isPending = input.required<boolean>();

  private nextPage$ = new Subject<void>();
  protected nextPage = outputFromObservable(this.nextPage$.pipe(throttleTime(150)));

  private viewport = viewChild.required(CdkVirtualScrollViewport);

  protected triggerNextPage() {
    if (
      //note: scrolled container size must be greater than 0, we have to scroll from the top and bottom must have an offset smaller than 50 to trigger
      this.viewport().measureRenderedContentSize() > 0 &&
      this.viewport().measureScrollOffset('top') !== 0 &&
      this.viewport().measureScrollOffset('bottom') < 800
    ) {
      this.nextPage$.next();
    }
  }

  protected trackById(_: number, it: {id: unknown}) {
    return it?.id;
  }
}
