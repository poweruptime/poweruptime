import {DatePipe} from '@angular/common';
import {Component, Pipe, PipeTransform, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';

import {map, timer} from 'rxjs';

import {BrnTooltipContentTemplate} from '@spartan-ng/brain/tooltip';
import {HlmTooltipImports} from '@spartan-ng/helm/tooltip';
import {formatDistanceStrict} from 'date-fns';

@Pipe({
  name: 'relativeTime',
  standalone: true,
  pure: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | number | undefined, currentDate = new Date()) {
    if (!value) {
      return value;
    }
    return formatDistanceStrict(value, currentDate, {addSuffix: true});
  }
}

@Component({
  template: `
    <hlm-tooltip>
      <span [class]="_class()" hlmTooltipTrigger>
        {{ value() | relativeTime: currentDate() }}
      </span>
      <span *brnTooltipContent>{{ value() | date: format() }}</span>
    </hlm-tooltip>
  `,
  selector: 'pu-relative-time',
  standalone: true,
  imports: [RelativeTimePipe, DatePipe, HlmTooltipImports, BrnTooltipContentTemplate],
})
export class RelativeTimeWithTooltip {
  currentDate = toSignal(timer(0, 30000).pipe(map(() => new Date())), {initialValue: new Date()});

  value = input.required<string | Date | number | undefined>();
  format = input.required<string>();
  _class = input<string>(undefined, {alias: 'class'});
}
