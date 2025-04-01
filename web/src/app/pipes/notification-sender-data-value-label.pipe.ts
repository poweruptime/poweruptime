import {Pipe, PipeTransform} from '@angular/core';

import {NOTIFICATION_METHOD_SENDER_DATA_TYPES} from '@app/api';

@Pipe({name: 'notificationSenderDataValueLabel', pure: true})
export class NotificationSenderDataValueLabelPipe implements PipeTransform {
  transform(value: string): string {
    const label = NOTIFICATION_METHOD_SENDER_DATA_TYPES.find((it) => it.value === value)?.label;
    if (!label) {
      throw new Error(`Unknown notification sender data type "${value}"`);
    }
    return label;
  }
}
