import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  inject,
  input,
} from '@angular/core';

import {HLM_CHART_THEME, HlmChartImports, hlmChartTooltip} from '@spartan-ng/helm/chart';
import {areaY, d3Curve, defineChart} from '@tanstack/charts';
import {scaleLinear} from '@tanstack/charts/scales/linear';
import {scalePoint} from '@tanstack/charts/scales/point';
import {curveMonotoneX} from 'd3-shape';

import {BackendType} from '@app/api';

const monotone = d3Curve(curveMonotoneX);

/** Ping timeline whose missing measurements are null, rendered as gaps. */
export type PingChartData = Omit<BackendType['PingTimelineResponse'], 'data'> & {
  data: {name: string; value: number | null}[];
};

@Component({
  selector: 'pu-ping-chart',
  imports: [HlmChartImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tanstack-chart [options]="chartOptions()" hlmChart />
  `,
})
export class PingChart {
  private readonly dateFormat = new DatePipe(inject(LOCALE_ID));

  readonly chart = input.required<PingChartData>();

  protected readonly chartOptions = computed(() => {
    const chart = this.chart();

    // Normalize the date so TanStack has a proper ChartValue
    // while retaining categorical/equal spacing like the old chart.
    const data = chart.data.map((item) => ({
      ...item,
      date: new Date(item.name),
    }));
    const highestValue = Math.max(50, chart.highestValue, ...data.map((item) => item.value ?? 0));

    return {
      definition: defineChart(
        {
          marks: [
            areaY(data, {
              id: 'ping',
              x: 'date',
              y1: 0,
              y2: 'value',

              fill: 'var(--chart-primary)',
              fillOpacity: 0.15,
              stroke: 'var(--chart-primary)',
              strokeWidth: 2.5,

              curve: monotone,
            }),
          ],

          scales: {
            x: {
              scale: () => scalePoint<Date>().padding(0.2),
              axis: {
                ticks: {
                  format: (value: Date) => this.dateFormat.transform(value, 'dd.MM HH:mm') ?? '',
                },
              },
            },

            y: {
              scale: scaleLinear().domain([0, highestValue]),
              grid: true,
              axis: {
                label: 'Ping (ms)',
              },
            },
          },

          clip: true,
          theme: HLM_CHART_THEME,
        },
        {
          focus: 'nearest-x',
          tooltip: hlmChartTooltip({
            content: (points) => {
              const point = points[0];

              return {
                title: point
                  ? (this.dateFormat.transform(point.xValue, 'dd.MM HH:mm') ?? undefined)
                  : undefined,

                rows: points.map((point) => ({
                  label: 'Ping (ms)',
                  value: `${point.yValue.toLocaleString()} ms`,
                  color: point.color,
                })),
              };
            },
          }),
        },
      ),

      ariaLabel: 'Ping timeline',
      ariaDescription: 'Ping response time over time in milliseconds.',
      height: 400,
    };
  });
}
