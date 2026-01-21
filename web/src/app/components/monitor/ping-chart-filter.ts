import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {BrnSelectImports} from '@spartan-ng/brain/select';
import {HlmDatePickerImports} from '@spartan-ng/helm/date-picker';
import {HlmEmptyImports} from '@spartan-ng/helm/empty';
import {HlmIconImports} from '@spartan-ng/helm/icon';
import {HlmSelectImports} from '@spartan-ng/helm/select';
import {format} from 'date-fns';
import {linkedQueryParam, paramToNumber} from 'ngxtension/linked-query-param';

import {injectDateRangeValidator} from '@app/form';
import {CheckResultsPingStore} from '@app/services';
import {dateToDateTime, toBackendDate} from '@app/services/util';

import {ChartPlaceholder} from '../chart-placeholder.component';
import {TableFilter} from '../table-filter';
import {PingChart} from './ping-chart';

@Component({
  template: `
    <div class="flex flex-col gap-2">
      <pu-table-filter [key]="tableKey">
        <hlm-select
          class="inline-block"
          [(value)]="precision"
          [placeholder]="'general.status' | transloco"
          multiple>
          <hlm-select-trigger>
            <hlm-select-value class="min-w-38" />
          </hlm-select-trigger>
          <hlm-select-content>
            <hlm-option [value]="2">{{ 'general.xMinutes' | transloco: {value: 2} }}</hlm-option>
            <hlm-option [value]="5">{{ 'general.xMinutes' | transloco: {value: 5} }}</hlm-option>
            <hlm-option [value]="15">{{ 'general.xMinutes' | transloco: {value: 15} }}</hlm-option>
            <hlm-option [value]="30">{{ 'general.xMinutes' | transloco: {value: 30} }}</hlm-option>
            <hlm-option [value]="60">{{ 'general.xMinutes' | transloco: {value: 60} }}</hlm-option>
            <hlm-option [value]="180">{{ 'general.xHours' | transloco: {value: 3} }}</hlm-option>
            <hlm-option [value]="360">{{ 'general.xHours' | transloco: {value: 6} }}</hlm-option>
          </hlm-select-content>
        </hlm-select>

        <hlm-date-range-picker
          class="max-w-52"
          [max]="max"
          [autoCloseOnEndSelection]="true"
          [formatDates]="formatDates"
          [date]="startDate() && endDate() ? [startDate()!, endDate()!] : undefined"
          (dateChange)="start.set(toBackendDate($event![0]!)); end.set(toBackendDate($event![1]!))"
          buttonId="rangePicker">
          <span>{{ 'general.startEnd' | transloco }}</span>
        </hlm-date-range-picker>
      </pu-table-filter>

      @if (checkResultsPingStore.isFulfilled()) {
        @if (pingChartEmpty()) {
          <div hlmEmpty>
            <div hlmEmptyHeader>
              <div hlmEmptyMedia variant="icon">
                <ng-icon hlm name="lucideCircleQuestionMark" />
              </div>
              <div hlmEmptyTitle>{{ 'monitor.details.pingChart.empty.title' | transloco }}</div>
              <div hlmEmptyDescription>
                {{ 'monitor.details.pingChart.empty.description' | transloco }}
              </div>
            </div>
          </div>
        } @else {
          <pu-ping-chart [chart]="checkResultsPingStore.data()!" />
        }
      } @else if (checkResultsPingStore.error()) {
        @if (validDateRange()) {
          <div hlmEmpty>
            <div hlmEmptyHeader>
              <div hlmEmptyMedia variant="icon">
                <ng-icon hlm name="lucideCalendarX2" />
              </div>
              <div hlmEmptyTitle>
                {{ 'monitor.details.pingChart.exceedsMaxWindow' | transloco }}
              </div>
            </div>
          </div>
        }
      } @else {
        <pu-chart-placeholder class="w-full" style="height: 24rem" />
      }
    </div>
  `,
  selector: 'pu-ping-chart-filter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CheckResultsPingStore],
  imports: [
    TableFilter,
    PingChart,
    ChartPlaceholder,
    TranslocoPipe,
    HlmSelectImports,
    BrnSelectImports,
    HlmDatePickerImports,
    HlmIconImports,
    HlmEmptyImports,
  ],
})
export class PingChartFilter {
  protected readonly tableKey = 'ping';

  protected readonly max = new Date();
  protected readonly toBackendDate = toBackendDate;
  protected readonly formatDates = (dates: [Date | undefined, Date | undefined]) =>
    dates
      .filter((it) => !!it)
      .map((it) => format(it, 'dd.M.yyyy'))
      .reduce((prev, curr, index) => `${prev}${index == 1 ? ' - ' : ''}${curr}`, '');

  protected readonly checkResultsPingStore = inject(CheckResultsPingStore);

  readonly monitorId = input.required<string>();

  protected readonly precision = linkedQueryParam('ping.filter.precision', {
    parse: paramToNumber({
      defaultValue: 15,
    }),
    stringify: (value) => (value === 15 ? null : value),
  });
  protected readonly start = linkedQueryParam('ping.filter.start', {
    parse: (it) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return it ?? toBackendDate(yesterday);
    },
    stringify: (value) => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return value === toBackendDate(yesterday) ? null : value;
    },
  });
  protected readonly end = linkedQueryParam('ping.filter.end', {
    parse: (it) => it ?? toBackendDate(new Date()),
    stringify: (value) => (value === toBackendDate(new Date()) ? null : value),
  });

  protected readonly startDate = computed(() =>
    this.start() ? new Date(this.start()!) : undefined,
  );
  protected readonly endDate = computed(() => (this.end() ? new Date(this.end()!) : undefined));

  protected readonly pingChartEmpty = computed(() =>
    this.checkResultsPingStore.data()?.data?.every((it) => it.value === 0),
  );

  protected readonly validDateRange = injectDateRangeValidator(31, this.start, this.end);

  constructor() {
    this.checkResultsPingStore.load(
      computed(() => {
        const start = this.start();
        const end = this.end();
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const hasSelectedYesterday = start === toBackendDate(yesterday);
        const hasSelectedToday = end === toBackendDate(now);
        return {
          monitorId: this.monitorId(),
          precision: this.precision(),
          start: dateToDateTime(
            start,
            hasSelectedYesterday ? yesterday.getHours() : 0,
            hasSelectedYesterday ? yesterday.getMinutes() : 0,
            hasSelectedYesterday ? yesterday.getHours() : 0,
            0,
          ),
          end: dateToDateTime(
            end,
            hasSelectedToday ? now.getHours() : 0,
            hasSelectedToday ? now.getMinutes() : 0,
            hasSelectedToday ? now.getSeconds() : 0,
            0,
          ),
        };
      }),
    );
  }
}
