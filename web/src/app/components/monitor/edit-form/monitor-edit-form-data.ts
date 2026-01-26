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
    @let typeValue = type();
    @if (typeValue !== '') {
      @defer (when typeValue === 'DNS') {
        @if (typeValue === 'DNS') {
          <pu-monitor-edit-form-dns-data />
        }
      }

      @defer (when typeValue === 'HTTP') {
        @if (typeValue === 'HTTP') {
          <pu-monitor-edit-form-http-data />
        }
      }

      @defer (when typeValue === 'PING') {
        @if (typeValue === 'PING') {
          <pu-monitor-edit-form-ping-data />
        }
      }

      @defer (when typeValue === 'PUSH') {
        @if (typeValue === 'PUSH') {
          <pu-monitor-edit-form-push-data />
        }
      }

      @defer (when typeValue === 'SSL_CERTIFICATE') {
        @if (typeValue === 'SSL_CERTIFICATE') {
          <pu-monitor-edit-form-ssl-certificate-data />
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
