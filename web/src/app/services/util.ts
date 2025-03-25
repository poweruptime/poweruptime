import {format} from 'date-fns';

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
  return format(dateString, 'yyyy-MM-dd');
}

export function toBackendDateTime(dateString: Date | string): string {
  return format(dateString, "yyyy-MM-dd'T'HH:mm:ss.SSSZ");
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
