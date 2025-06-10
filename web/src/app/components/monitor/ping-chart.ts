import {DatePipe} from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  LOCALE_ID,
  afterNextRender,
  inject,
  input,
  viewChild,
} from '@angular/core';

import {AreaChartModule} from '@swimlane/ngx-charts';
import Chart, {TooltipItem} from 'chart.js/auto';

@Component({
  template: `
    <div class="relative w-full">
      <canvas class="w-full" #chartView></canvas>
    </div>
    <div class="flex justify-between px-3">
      @let _chart = chart();
      <span>
        @if (_chart.data[0]; as entry) {
          {{ entry.name | date: 'yyyy.MM.dd HH:mm' }}
        } @else {
          ERROR
        }
      </span>
      <span>
        @if (_chart.data[_chart.data.length - 1]; as entry) {
          {{ entry.name | date: 'yyyy.MM.dd HH:mm' }}
        } @else {
          ERROR
        }
      </span>
    </div>
  `,
  selector: 'pu-ping-chart',
  imports: [AreaChartModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PingChart {
  private readonly locale = inject(LOCALE_ID);
  private readonly dateFormat = new DatePipe(this.locale);

  chart = input.required<{
    data: {name: string; value: number}[];
    smallestValue: number;
    highestValue: number;
  }>();

  chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartView');

  constructor() {
    afterNextRender(() => {
      const chart = this.chart();
      new Chart(this.chartCanvas().nativeElement, {
        type: 'line',
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
          },
          scales: {
            x: {
              ticks: {
                display: false,
              },
              grid: {
                display: false,
              },
            },
            y: {
              min: chart.smallestValue,
              max: chart.highestValue,
              title: {
                display: true,
                text: 'Ping (ms)',
              },
              grid: {
                display: true,
                drawTicks: true,
                color: 'oklch(70.7% 0.022 261.325)',
                lineWidth: 1,
              },
            },
          },
          parsing: {
            xAxisKey: 'name',
            yAxisKey: 'value',
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                title(_: TooltipItem<'line'>[]): string | string[] | void {
                  return '';
                },
                label: (tooltipItem: TooltipItem<'line'>): string => {
                  return `${tooltipItem.formattedValue}ms - ${this.dateFormat.transform(tooltipItem.label, 'YYYY.MM.dd HH:mm:ss')}`;
                },
              },
            },
          },
        },
        data: {
          datasets: [
            {
              fill: 'start',
              data: chart.data,
            },
          ],
        },
      });
    });
  }
}
