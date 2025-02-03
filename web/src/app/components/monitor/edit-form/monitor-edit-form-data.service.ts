import {inject} from '@angular/core';
import {FormControl, NonNullableFormBuilder, Validators} from '@angular/forms';

import {createInjectable} from 'ngxtension/create-injectable';

import {
  BackendType,
  Database,
  DnsMonitorDataType,
  HttpMonitorDataContentType,
  HttpMonitorDataMethod,
} from '@app/api';

const baseCheckerProperties = {
  _type: [''],
};

export const MonitorEditFormDataService = createInjectable(() => {
  const fb = inject(NonNullableFormBuilder);

  const dnsDataFormGroup = fb.group({
    ...baseCheckerProperties,
    host: ['', [Validators.required]],
    server: ['', [Validators.required]],
    port: [53, [Validators.required, Validators.min(1)]],
    type: ['CNAME' as DnsMonitorDataType, [Validators.required]],
    matches: new FormControl<string[] | undefined>(undefined),
  });

  const httpDataFormGroup = fb.group({
    ...baseCheckerProperties,
    url: [
      '',
      [
        Validators.required,
        Validators.pattern(
          'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
        ),
      ],
    ],
    method: ['GET' as HttpMonitorDataMethod, [Validators.required]],
    contentType: ['JSON' as HttpMonitorDataContentType, [Validators.required]],
    ignoreTLS: [false, [Validators.required]],
    body: [undefined as string | undefined],
    searchTerm: [undefined as string | undefined],
    authType: [undefined as 'BASIC_AUTH' | undefined],
    basicAuthDataUsername: [
      undefined as string | undefined,
      [Validators.maxLength(Database.MAX_BASIC_AUTH_LENGTH)],
    ],
    basicAuthDataPassword: [
      undefined as string | undefined,
      [Validators.maxLength(Database.MAX_BASIC_AUTH_LENGTH)],
    ],
  });

  const pingDataFormGroup = fb.group({
    ...baseCheckerProperties,
    ip: [
      '',
      [
        Validators.required,
        Validators.pattern(
          '^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$',
        ),
      ],
    ],
    port: [undefined as number | undefined, [Validators.required, Validators.min(1)]],
  });

  const pushDataFormGroup = fb.group({
    ...baseCheckerProperties,
    pushId: ['', [Validators.required]],
  });

  const sslCertificateDataFormGroup = fb.group({
    ...baseCheckerProperties,
    url: [
      '',
      [
        Validators.required,
        Validators.pattern(
          'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
        ),
      ],
    ],
    validDaysLeft: [undefined as number | undefined, [Validators.min(1)]],
  });

  return {
    dnsDataFormGroup,
    httpDataFormGroup,
    pingDataFormGroup,
    pushDataFormGroup,
    sslCertificateDataFormGroup,
    formCheckerFactory: (type: BackendType['MonitorCheckerData']['_type']) => {
      switch (type) {
        case 'DNS':
          return dnsDataFormGroup;
        case 'HTTP':
          return httpDataFormGroup;
        case 'PING':
          return pingDataFormGroup;
        case 'PUSH':
          return pushDataFormGroup;
        case 'SSL_CERTIFICATE':
          return sslCertificateDataFormGroup;
        default:
          throw `Unsupported type "${type}"`;
      }
    },
  };
});
