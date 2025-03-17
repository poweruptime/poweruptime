import {NativeDateAdapter} from '@angular/material/core';

import {BackendType} from '@app/api';

export const mapUptime = (uptime: BackendType['MonitorMaxResponse']['uptime']) => [
  {
    name: 'Last hour',
    value: uptime.oneHour,
  },
  {
    name: '3 hours',
    value: uptime.threeHours,
  },
  {
    name: '6 hours',
    value: uptime.sixHours,
  },
  {
    name: '12 hours',
    value: uptime.twelveHours,
  },
  {
    name: 'Last day',
    value: uptime.oneDay,
  },
  {
    name: '3 days',
    value: uptime.threeDays,
  },
  {
    name: 'Last week',
    value: uptime.oneWeek,
  },
  {
    name: '2 weeks',
    value: uptime.twoWeeks,
  },
  {
    name: 'Last month',
    value: uptime.oneMonth,
  },
  {
    name: '3 months',
    value: uptime.threeMonths,
  },
  {
    name: '6 months',
    value: uptime.sixMonths,
  },
  {
    name: 'Last year',
    value: uptime.oneYear,
  },
];

export const calculatePingChart = (checkResults: BackendType['CheckResultMinResponse'][]) => {
  const series = checkResults.map((cr) => ({name: cr.createdAt, value: cr.pingMs ?? 0})).reverse();
  const values = series.map((it) => it.value).filter((it) => it !== 0);
  const smallest = Math.min(...values);
  const biggest = Math.max(...values);

  // Sort lists by name if needed, as merging unique items might change the order
  series.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  return {
    data: [
      {
        name: 'Ping',
        series,
      },
    ],
    smallestValue: smallest - 50 >= 0 ? smallest - 50 : 0,
    highestValue: biggest + 50,
  };
};

export function toBackendDate(dateString: Date | string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function toBackendDateTime(dateString: Date | string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  const timezoneOffset = date.getTimezoneOffset();
  const timezoneOffsetHours = String(Math.abs(Math.floor(timezoneOffset / 60))).padStart(2, '0');
  const timezoneOffsetMinutes = String(Math.abs(timezoneOffset % 60)).padStart(2, '0');
  const timezoneOffsetSign = timezoneOffset > 0 ? '-' : '+';

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}${timezoneOffsetSign}${timezoneOffsetHours}:${timezoneOffsetMinutes}`;
}

export function dateToDateTime(
  dateString: string | Date,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): string {
  const date = new Date(dateString);

  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);
  date.setMilliseconds(milliseconds);

  return toBackendDateTime(date);
}
