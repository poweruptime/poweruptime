import {ChangeDetectionStrategy, Component} from '@angular/core';

import {NotificationMethodList} from '@app/components/notification-method';

@Component({
  template: `
    <pu-notification-method-list />
  `,
  selector: 'pu-notification-methods-page',
  imports: [NotificationMethodList],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationMethodsPage {}
