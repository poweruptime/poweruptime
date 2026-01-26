import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {NotificationMethodDataType} from '@app/api';

import {NotificationMethodEditFormAppriseData} from './notification-method-edit-form-apprise-data';
import {NotificationMethodEditFormDataCard} from './notification-method-edit-form-data-card';
import {NotificationMethodEditFormDiscordData} from './notification-method-edit-form-discord-data';
import {NotificationMethodEditFormEmailData} from './notification-method-edit-form-email-data';
import {NotificationMethodEditFormSlackData} from './notification-method-edit-form-slack-data';

@Component({
  template: `
    @let _type = type();
    @if (_type !== '') {
      @defer (when _type === 'APPRISE') {
        @if (_type === 'APPRISE') {
          <pu-notification-method-edit-form-data-card [type]="_type">
            <pu-notification-method-edit-form-apprise-data />
          </pu-notification-method-edit-form-data-card>
        }
      }

      @defer (when _type === 'DISCORD') {
        @if (_type === 'DISCORD') {
          <pu-notification-method-edit-form-data-card [type]="_type">
            <pu-notification-method-edit-form-discord-data />
          </pu-notification-method-edit-form-data-card>
        }
      }

      @defer (when _type === 'EMAIL') {
        @if (_type === 'EMAIL') {
          <pu-notification-method-edit-form-data-card [type]="_type">
            <pu-notification-method-edit-form-email-data />
          </pu-notification-method-edit-form-data-card>
        }
      }

      @defer (when _type === 'SLACK') {
        @if (_type === 'SLACK') {
          <pu-notification-method-edit-form-data-card [type]="_type">
            <pu-notification-method-edit-form-slack-data />
          </pu-notification-method-edit-form-data-card>
        }
      }
    } @else {
      <pu-notification-method-edit-form-data-card>
        <label for="type">{{ 'notificationMethod.edit.selectTypeToContinue' | transloco }}</label>
      </pu-notification-method-edit-form-data-card>
    }
  `,
  selector: 'pu-notification-method-edit-form-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NotificationMethodEditFormAppriseData,
    NotificationMethodEditFormEmailData,
    NotificationMethodEditFormDiscordData,
    NotificationMethodEditFormSlackData,
    TranslocoPipe,
    NotificationMethodEditFormDataCard,
  ],
})
export class NotificationMethodEditFormData {
  type = input.required<NotificationMethodDataType | ''>();
}
