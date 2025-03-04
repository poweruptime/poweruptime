import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input, signal} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {AreaChartModule} from '@swimlane/ngx-charts';
import * as shape from 'd3-shape';
import {DfxTimeLeftPipe} from 'dfx-helper';

@Component({
  template: `
    @let _chart = chart();

    <div class="pr-8">
      <ngx-charts-area-chart
        [scheme]="'cool'"
        [xAxisLabel]="'Time'"
        [curve]="curve"
        [animations]="false"
        [showXAxisLabel]="true"
        [yAxis]="true"
        [yAxisLabel]="'Ping (ms)'"
        [showYAxisLabel]="true"
        [yScaleMax]="_chart.biggest"
        [yScaleMin]="_chart.smallest"
        [results]="_chart.data">
        <ng-template #tooltipTemplate let-model="model">
          <div class="flex flex-col p-2 pt-3">
            <span class="text-md">
              {{ model.name | date: 'YYYY.MM.dd HH:mm:ss' }}
            </span>
            <span class="text-lg">{{ model.value }}ms</span>
          </div>
        </ng-template>
      </ngx-charts-area-chart>
    </div>
    <div class="flex justify-between pr-4" style="padding-left: 5.5rem">
      <span>
        @if (_chart.data[0].series[0]; as entry) {
          {{ entry.name | date: 'HH:mm' }}

          <span class="text-xs">
            ({{
              'monitor.pingChart.ago' | transloco: {time: entry.name | d_timeLeft: currentDate()}
            }})
          </span>
        } @else {
          ERROR
        }
      </span>
      <span>{{ 'general.now' | transloco }}</span>
    </div>
  `,
  selector: 'pu-ping-chart',
  imports: [AreaChartModule, DatePipe, DfxTimeLeftPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PingChart {
  readonly curve = shape.curveStepAfter;
  readonly currentDate = signal(new Date());

  chart = input.required<{
    data: {name: string; series: {name: string; value: number}[]}[];
    smallest: number;
    biggest: number;
  }>();
}
