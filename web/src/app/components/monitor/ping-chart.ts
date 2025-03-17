import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, input} from '@angular/core';

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
        [yScaleMax]="_chart.highestValue"
        [yScaleMin]="_chart.smallestValue"
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
          {{ entry.name | date: 'YYYY.MM.dd HH:mm' }}
        } @else {
          ERROR
        }
      </span>
      <span>
        @if (_chart.data[0].series[_chart.data[0].series.length - 1]; as entry) {
          {{ entry.name | date: 'YYYY.MM.dd HH:mm' }}
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
  readonly curve = shape.curveLinear;

  chart = input.required<{
    data: {name: string; series: {name: string; value: number}[]}[];
    smallestValue: number;
    highestValue: number;
  }>();
}
