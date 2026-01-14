import {format} from 'date-fns';

import {BackendType} from '@app/api';

export const buildPingStatistics = (ping?: BackendType['PublicPingStatistics']) =>
  ping
    ? [
        {
          name: 'Last hour',
          value: ping.oneHour,
        },
        {
          name: '3 hours',
          value: ping.threeHours,
        },
        {
          name: '6 hours',
          value: ping.sixHours,
        },
        {
          name: '12 hours',
          value: ping.twelveHours,
        },
        {
          name: 'Last day',
          value: ping.oneDay,
        },
      ]
    : [];

export const buildUptimeStatistics = (uptime?: BackendType['PublicUptimeStatistics']) =>
  uptime
    ? [
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
      ]
    : [];

export const calculatePingChart = (checkResults: BackendType['CheckResultMinResponse'][]) => {
  const data = checkResults.map((cr) => ({name: cr.createdAt, value: cr.pingMs ?? 0})).reverse();

  const values = data.map((d) => d.value).filter((v) => v !== 0);

  const smallest = Math.min(...values);
  const biggest = Math.max(...values);

  // Sort by timestamp
  data.sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  const smallestValue = Math.max(Math.floor(smallest / 50) * 50, 0);
  const highestValue = Math.ceil(biggest / 50) * 50;

  return {
    data,
    smallestValue,
    highestValue,
  };
};

export function toBackendDate(dateString: Date | string): string {
  return format(dateString, 'yyyy-MM-dd');
}

export function toBackendDateTime(dateString: Date | string): string {
  return format(dateString, "yyyy-MM-dd'T'HH:mm:ss.SSSXX");
}

export function dateToDateTime(
  dateString: string | Date,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0,
): string {
  const date = new Date(dateString);

  date.setHours(hours);
  date.setMinutes(minutes);
  date.setSeconds(seconds);
  date.setMilliseconds(milliseconds);

  return toBackendDateTime(date);
}

export const TailwindBreakpoints = {
  xs: '(max-width: 639.98px)', // Small
  sm: '(min-width: 640px) and (max-width: 767.98px)', // Small
  md: '(min-width: 768px) and (max-width: 1023.98px)', // Medium
  lg: '(min-width: 1024px) and (max-width: 1279.98px)', // Large
  xl: '(min-width: 1280px) and (max-width: 1535.98px)', // Extra large
  '2xl': '(min-width: 1536px) and (max-width: 1909.98px)',
  '3xl': 'min-width: 1910px',
};

export const isMobileBreakpoints = [
  TailwindBreakpoints.xs,
  TailwindBreakpoints.sm,
  TailwindBreakpoints.md,
  TailwindBreakpoints.lg,
];
