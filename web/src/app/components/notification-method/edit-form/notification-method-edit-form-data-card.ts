import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';

import {NotificationMethodDataType} from '@app/api';
import {NotificationSenderDataValueLabelPipe} from '@app/pipes';

@Component({
  template: `
    <section class="w-full" hlmCard>
      @let _type = type();
      <div hlmCardHeader>
        <h3 hlmCardTitle>
          @if (_type !== '') {
            {{ _type | notificationSenderDataValueLabel | transloco }} -
            {{ 'general.configuration' | transloco }}
          } @else {
            {{ 'notificationMethod.edit.selectTypeToContinue' | transloco }}
          }
        </h3>
      </div>
      <div hlmCardContent>
        <ng-content />
      </div>
    </section>
  `,
  selector: 'pu-notification-method-edit-form-data-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NotificationSenderDataValueLabelPipe, HlmCardImports, TranslocoPipe],
})
export class NotificationMethodEditFormDataCard {
  type = input<NotificationMethodDataType | ''>('');
}
