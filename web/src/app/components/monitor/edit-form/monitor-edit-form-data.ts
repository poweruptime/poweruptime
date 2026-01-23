import {ChangeDetectionStrategy, Component, input} from '@angular/core';

import {TranslocoPipe} from '@jsverse/transloco';
import {HlmCardImports} from '@spartan-ng/helm/card';
import {HlmIconImports} from '@spartan-ng/helm/icon';

import {MonitorDataType} from '@app/api';
import {MonitorCheckerDataValueLabelPipe} from '@app/pipes';

import {MonitorEditFormDnsData} from './monitor-edit-form-dns-data';
import {MonitorEditFormHttpData} from './monitor-edit-form-http-data';
import {MonitorEditFormPingData} from './monitor-edit-form-ping-data';
import {MonitorEditFormPushData} from './monitor-edit-form-push-data';
import {MonitorEditFormSSLCertificateData} from './monitor-edit-form-ssl-certificate-data';

@Component({
  template: `
    <section class="w-full" hlmCard>
      @let typeValue = type();
      <div hlmCardHeader>
        <div class="flex items-center gap-2">
          <ng-icon name="lucideServer" />
          <h3 hlmCardTitle>
            @if (typeValue !== '') {
              {{ typeValue | monitorCheckerDataValueLabel | transloco }}
              {{ 'general.configuration' | transloco }}
            } @else {
              {{ 'monitor.edit.selectTypeToContinue' | transloco }}
            }
          </h3>
        </div>
      </div>
      <div hlmCardContent>
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
          <label for="type">{{ 'monitor.edit.selectTypeToContinue' | transloco }}</label>
        }
      </div>
    </section>
  `,
  selector: 'pu-monitor-edit-form-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MonitorEditFormDnsData,
    MonitorEditFormHttpData,
    MonitorEditFormPingData,
    MonitorEditFormPushData,
    MonitorEditFormSSLCertificateData,
    HlmCardImports,
    HlmIconImports,
    TranslocoPipe,
    MonitorCheckerDataValueLabelPipe,
  ],
})
export class MonitorEditFormData {
  type = input.required<MonitorDataType | ''>();
}
