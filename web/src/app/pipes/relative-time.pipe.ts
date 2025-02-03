import {DATE_PIPE_DEFAULT_OPTIONS, DatePipe, formatDate} from '@angular/common';
import {Component, LOCALE_ID, Pipe, PipeTransform, inject, input} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {MatTooltip} from '@angular/material/tooltip';

import {map, timer} from 'rxjs';

@Pipe({
  name: 'relativeTime',
  standalone: true,
})
export class RelativeTimePipe implements PipeTransform {
  locale = inject(LOCALE_ID);
  defaultOptions = inject(DATE_PIPE_DEFAULT_OPTIONS, {optional: true});

  transform(
    value: string | Date | number | undefined,
    currentDate = new Date(),
    timezone?: string,
    locale?: string,
  ) {
    if (!value) {
      return value;
    }

    const date = new Date(value);

    const isPastDate = currentDate.getTime() >= date.getTime();

    if (isPastDate) {
      const differenceInSec = Math.abs(currentDate.getTime() - date.getTime()) / 1000;

      if (differenceInSec < 0) {
        throw 'Difference negative, can not be!!';
      }

      if (differenceInSec < 60) {
        return 'just now';
      }

      const differenceInMinutes = differenceInSec / 60;

      // Smaller than an hour
      if (differenceInMinutes < 60) {
        if (differenceInMinutes >= 1 && differenceInMinutes < 2) {
          return 'one minute ago';
        }
        return `${Math.trunc(differenceInMinutes)} minutes ago`;
      }

      const differenceInHours = differenceInMinutes / 60;

      // Smaller than a day
      if (differenceInHours < 24) {
        if (differenceInHours >= 1 && differenceInHours < 2) {
          return 'one hour ago';
        }
        return `${Math.trunc(differenceInHours)} hours ago`;
      }

      const differenceInDays = differenceInHours / 24;

      if (differenceInDays <= 2) {
        return 'yesterday';
      }

      if (differenceInDays <= 29) {
        return `${Math.trunc(differenceInDays)} days ago`;
      }

      const differenceInYears = differenceInDays / 29;

      return this.handleDateDifferenceBiggerThanAMonth(differenceInYears, date, timezone, locale);
    }

    const differenceInSec = Math.abs(date.getTime() - currentDate.getTime()) / 1000;

    if (differenceInSec < 0) {
      throw 'Difference negative, can not be!!';
    }

    if (differenceInSec < 60) {
      return 'just now';
    }

    const differenceInMinutes = differenceInSec / 60;

    // Smaller than an hour
    if (differenceInMinutes < 60) {
      if (differenceInMinutes >= 1 && differenceInMinutes < 2) {
        return 'in one minute';
      }
      return `in ${Math.trunc(differenceInMinutes)} minutes`;
    }

    const differenceInHours = differenceInMinutes / 60;

    // Smaller than a day
    if (differenceInHours < 24) {
      if (differenceInHours >= 1 && differenceInHours < 2) {
        return 'in one hour';
      }
      return `in ${Math.trunc(differenceInHours)} hours`;
    }

    const differenceInDays = differenceInHours / 24;

    if (differenceInDays <= 2) {
      return 'tomorrow';
    }

    if (differenceInDays <= 29) {
      return `in ${Math.trunc(differenceInDays)} days`;
    }

    const differenceInYears = differenceInDays / 29;

    return this.handleDateDifferenceBiggerThanAMonth(differenceInYears, date, timezone, locale);
  }

  private handleDateDifferenceBiggerThanAMonth(
    differenceInYears: number,
    date: Date,
    timezone?: string,
    locale?: string,
  ) {
    if (differenceInYears <= 12) {
      return `at ${formatDate(date, 'd MMM', locale ?? this.locale, timezone ?? this.defaultOptions?.timezone)}`;
    }

    return `at ${formatDate(date, 'd MMM YYYY', locale ?? this.locale, timezone ?? this.defaultOptions?.timezone)}`;
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
