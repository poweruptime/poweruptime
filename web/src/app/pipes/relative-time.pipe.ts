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

    // Check if dates are on the same day
    const isSameDay = (date1: Date, date2: Date) => {
      return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
      );
    };

    // Create yesterday and tomorrow dates for comparison
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);

    // Check if the date is yesterday or tomorrow
    if (isSameDay(date, yesterday)) {
      return 'yesterday';
    }

    if (isSameDay(date, tomorrow)) {
      return 'tomorrow';
    }

    const isPastDate = currentDate.getTime() >= date.getTime();
    const differenceInMs = Math.abs(currentDate.getTime() - date.getTime());
    const differenceInSec = differenceInMs / 1000;

    if (differenceInSec < 60) {
      return 'just now';
    }

    const differenceInMinutes = differenceInSec / 60;
    const differenceInHours = differenceInMinutes / 60;
    const differenceInDays = differenceInHours / 24;

    // Format based on whether it's past or future
    if (isPastDate) {
      // Less than an hour
      if (differenceInMinutes < 60) {
        if (differenceInMinutes < 2) {
          return 'one minute ago';
        }
        return `${Math.trunc(differenceInMinutes)} minutes ago`;
      }

      // Less than a day
      if (differenceInHours < 24) {
        if (differenceInHours < 2) {
          return 'one hour ago';
        }
        return `${Math.trunc(differenceInHours)} hours ago`;
      }

      // Less than a month
      if (differenceInDays <= 30) {
        return `${Math.trunc(differenceInDays)} days ago`;
      }
    } else {
      // Less than an hour
      if (differenceInMinutes < 60) {
        if (differenceInMinutes < 2) {
          return 'in one minute';
        }
        return `in ${Math.trunc(differenceInMinutes)} minutes`;
      }

      // Less than a day
      if (differenceInHours < 24) {
        if (differenceInHours < 2) {
          return 'in one hour';
        }
        return `in ${Math.trunc(differenceInHours)} hours`;
      }

      // Less than a month
      if (differenceInDays <= 30) {
        return `in ${Math.trunc(differenceInDays)} days`;
      }
    }

    // More than a month
    const differenceInMonths = differenceInDays / 30;

    if (differenceInMonths <= 12) {
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
