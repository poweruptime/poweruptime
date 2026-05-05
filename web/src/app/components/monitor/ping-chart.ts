import {DatePipe} from '@angular/common';
import {ChangeDetectionStrategy, Component, LOCALE_ID, inject, input} from '@angular/core';

import {AreaChartComponent, CurveType} from 'angular-chrts';

import {BackendType} from '@app/api';

@Component({
  template: `
    <ngx-area-chart
      [yDomain]="[chart().smallestValue, chart().highestValue]"
      [data]="chart().data"
      [categories]="categories"
      [curveType]="CurveType.MonotoneX"
      [height]="400"
      [xFormatter]="formatX"
      [tooltipTitleFormatter]="formatTooltipTitle"
      [yGridLine]="true"
      [hideLegend]="true"
      yLabel="Ping (ms)" />
  `,
  selector: 'pu-ping-chart',
  imports: [AreaChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PingChart {
  private readonly dateFormat = new DatePipe(inject(LOCALE_ID));

  protected readonly CurveType = CurveType;
  protected readonly categories = {
    value: {
      name: 'Ping (ms)',
      color: '#10b981',
    },
  };

  protected readonly formatX = (tick: number | Date) => {
    if (typeof tick === 'number') {
      const date = this.chart().data[tick]?.name;
      if (!date) {
        return '';
      }
      return this.dateFormat.transform(date, 'dd.MM HH:mm')!;
    }
    return '';
  };
  protected readonly formatTooltipTitle = (
    data: BackendType['PingTimelineResponse']['data'][0],
  ) => {
    return this.dateFormat.transform(data.name, 'dd.MM HH:mm')!;
  };

  chart = input.required<BackendType['PingTimelineResponse']>();
}
