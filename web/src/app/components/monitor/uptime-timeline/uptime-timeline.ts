import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  input,
} from '@angular/core';

import {ScrollingModule} from '@angular/cdk/scrolling';

import {BackendType} from '@app/api';

import {UptimeTimelineEntry} from './uptime-timeline-entry';

@Component({
  template: `
    @let _size = size();
    @let _link = link();
    @let _hideLabel = hideLabel();
    @let _checkResults = checkResults();
    @let length = _checkResults.length;
    @let maxLabelSize = length - 9;
    <div
      class="scroll-container"
      [class.h-24]="_size === 3 && !_hideLabel"
      [class.h-16]="(_size === 2 && !_hideLabel) || (_size === 3 && _hideLabel)"
      [class.h-8]="_size === 2 && _hideLabel">
      <div class="flex p-1">
        @for (
          checkResult of _checkResults;
          track checkResult.id;
          let index = $index;
          let first = $first;
          let last = $last
        ) {
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
        }
      </div>
    </div>
  `,
  styles: `
    .scroll-container {
      width: 100%;

      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      scroll-behavior: smooth;
    }
  `,
  selector: 'pu-uptime-timeline',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollingModule, UptimeTimelineEntry],
})
export class UptimeTimeline {
  checkResults = input.required<BackendType['CheckResultMinResponse'][]>();

  size = input<2 | 3>(3);

  link = input(false, {transform: booleanAttribute});
  hideLabel = input(false, {transform: booleanAttribute});
}
