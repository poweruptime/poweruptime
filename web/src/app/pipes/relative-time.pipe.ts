import {DatePipe} from '@angular/common';
import {Component, Pipe, PipeTransform, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTooltip} from '@angular/material/tooltip';

import {map, timer} from 'rxjs';

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
    <span [matTooltip]="value() | date: format()" [class]="_class()">
      {{ value() | relativeTime: currentDate() }}
    </span>
  `,
  selector: 'pu-relative-time',
  standalone: true,
  imports: [RelativeTimePipe, DatePipe, MatTooltip],
})
export class RelativeTimeWithTooltip {
  currentDate = toSignal(timer(0, 30000).pipe(map(() => new Date())), {initialValue: new Date()});

  value = input.required<string | Date | number | undefined>();
  format = input.required<string>();
  _class = input<string>(undefined, {alias: 'class'});
}
