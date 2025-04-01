import {Pipe, PipeTransform} from '@angular/core';

import {MONITOR_CHECKER_DATA_TYPES} from '@app/api';

@Pipe({name: 'monitorCheckerDataValueLabel', pure: true})
export class MonitorCheckerDataValueLabelPipe implements PipeTransform {
  transform(value: string): string {
    const label = MONITOR_CHECKER_DATA_TYPES.find((it) => it.value === value)?.label;
    if (!label) {
      throw new Error(`Unknown monitor checker data type "${value}"`);
    }
    return label;
  }
}
