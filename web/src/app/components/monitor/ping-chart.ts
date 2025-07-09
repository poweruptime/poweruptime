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

import Chart, {TooltipItem} from 'chart.js/auto';

import {ThemeStore} from '@app/services';

@Component({
  template: `
    <div class="relative h-80 w-full">
      <canvas class="w-full" #chartView></canvas>
    </div>
    <div class="flex justify-between px-3">
      @let _chart = chart();
      <span>
        @if (_chart.data[0]; as entry) {
          {{ entry.name | date: 'dd.MM. HH:mm' }}
        } @else {
          ERROR
        }
      </span>
      <span>
        @if (_chart.data[_chart.data.length - 1]; as entry) {
          {{ entry.name | date: 'dd.MM. HH:mm' }}
        } @else {
          ERROR
        }
      </span>
    </div>
  `,
  selector: 'pu-ping-chart',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PingChart {
  private readonly locale = inject(LOCALE_ID);
  private readonly dateFormat = new DatePipe(this.locale);
  private readonly themeService = inject(ThemeStore);

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
          backgroundColor: 'rgba(16, 185, 129, 0.2)', // emerald-500 @ 20% alpha
          borderColor: 'rgba(16, 185, 129, 1)',
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
                color:
                  this.themeService.currentTheme() === 'dark'
                    ? 'oklch(27.8% 0.033 256.848)'
                    : 'oklch(92.8% 0.006 264.531)',
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
                  return `${tooltipItem.formattedValue}ms - ${this.dateFormat.transform(tooltipItem.label, 'yyyy.MM.dd HH:mm:ss')}`;
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
