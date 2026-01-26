import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';

import {MonitorDataType} from '@app/api';

import {MonitorEditFormDataCard} from './monitor-edit-form-data-card';
import {MonitorEditFormDnsData} from './monitor-edit-form-dns-data';
import {MonitorEditFormHttpData} from './monitor-edit-form-http-data';
import {MonitorEditFormPingData} from './monitor-edit-form-ping-data';
import {MonitorEditFormPushData} from './monitor-edit-form-push-data';
import {MonitorEditFormSSLCertificateData} from './monitor-edit-form-ssl-certificate-data';

@Component({
  template: `
    @let _type = type();
    @if (_type !== '') {
      @defer (when _type === 'DNS') {
        @if (_type === 'DNS') {
          <pu-monitor-edit-form-data-card [type]="_type">
            <pu-monitor-edit-form-dns-data />
          </pu-monitor-edit-form-data-card>
        }
      }

      @defer (when _type === 'HTTP') {
        @if (_type === 'HTTP') {
          <pu-monitor-edit-form-http-data />
        }
      }

      @defer (when _type === 'PING') {
        @if (_type === 'PING') {
          <pu-monitor-edit-form-data-card [type]="_type">
            <pu-monitor-edit-form-ping-data />
          </pu-monitor-edit-form-data-card>
        }
      }

      @defer (when _type === 'PUSH') {
        @if (_type === 'PUSH') {
          <pu-monitor-edit-form-data-card [type]="_type">
            <pu-monitor-edit-form-push-data />
          </pu-monitor-edit-form-data-card>
        }
      }

      @defer (when _type === 'SSL_CERTIFICATE') {
        @if (_type === 'SSL_CERTIFICATE') {
          <pu-monitor-edit-form-data-card [type]="_type">
            <pu-monitor-edit-form-ssl-certificate-data />
          </pu-monitor-edit-form-data-card>
        }
      }
    } @else {
      <pu-monitor-edit-form-data-card>
        <label for="type">{{ 'monitor.edit.selectTypeToContinue' | transloco }}</label>
      </pu-monitor-edit-form-data-card>
    }
  `,
  selector: 'pu-monitor-edit-form-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MonitorEditFormDnsData,
    MonitorEditFormHttpData,
    MonitorEditFormPingData,
    MonitorEditFormPushData,
    MonitorEditFormSSLCertificateData,
    TranslocoPipe,
    MonitorEditFormDataCard,
  ],
})
export class MonitorEditFormData {
  type = input.required<MonitorDataType | ''>();
}
