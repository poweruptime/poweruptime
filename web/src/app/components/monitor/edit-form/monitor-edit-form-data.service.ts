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

import {arrayItemMaxLength, arrayItemMinLength, arrayItemPattern} from '../../../form';

const baseCheckerProperties = {
  _type: [''],
};

export const MonitorEditFormDataService = createInjectable(
  () => {
    const fb = inject(NonNullableFormBuilder);

    const dnsDataFormGroup = fb.group({
      ...baseCheckerProperties,
      host: [
        '',
        [
          Validators.required,
          Validators.minLength(Database.MIN_DOMAIN_LENGTH),
          Validators.maxLength(Database.MAX_DOMAIN_LENGTH),
          Validators.pattern(Database.DOMAIN_REGEX),
        ],
      ],
      server: [
        '',
        [
          Validators.required,
          Validators.minLength(Database.MIN_IPV4_LENGTH),
          Validators.maxLength(Database.MAX_IPV4_LENGTH),
          Validators.pattern(Database.IPV4_REGEX),
        ],
      ],
      port: [
        53,
        [
          Validators.required,
          Validators.min(Database.MIN_PORT),
          Validators.max(Database.MAX_PORT),
          Validators.pattern(Database.INTEGER_REGEX),
        ],
      ],
      type: ['CNAME' as DnsMonitorDataType, [Validators.required]],
      matches: new FormControl<string[] | undefined>(undefined),
    });

    const httpDataFormGroup = fb.group({
      ...baseCheckerProperties,
      url: [
        '',
        [
          Validators.required,
          Validators.minLength(Database.MIN_URL_LENGTH),
          Validators.maxLength(Database.MAX_URL_LENGTH),
          Validators.pattern(Database.URL_REGEX),
        ],
      ],
      method: ['GET' as HttpMonitorDataMethod, [Validators.required]],
      contentType: ['JSON' as HttpMonitorDataContentType, [Validators.required]],
      allowedStatusCodeRanges: new FormControl<string[]>(
        ['200 - 299'],
        [
          Validators.required,
          arrayItemMinLength(Database.MIN_STATUS_CODES),
          arrayItemPattern(Database.STATUS_CODE_REGEX),
        ],
      ),
      maxRedirects: [
        10 as number | undefined,
        [
          Validators.min(Database.MIN_REDIRECTS),
          Validators.max(Database.MAX_REDIRECTS),
          Validators.pattern(Database.INTEGER_REGEX),
        ],
      ],
      ignoreTLS: [false, [Validators.required]],
      certificateExpiry: [false, [Validators.required]],
      certificateValidDaysLeft: [
        undefined as number | undefined,
        [
          Validators.min(Database.MIN_VALID_DAYS_LEFT),
          Validators.max(Database.MAX_VALID_DAYS_LEFT),
          Validators.pattern(Database.INTEGER_REGEX),
        ],
      ],
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
          Validators.minLength(Database.MIN_IPV4_LENGTH),
          Validators.maxLength(Database.MAX_IPV4_LENGTH),
          Validators.pattern(Database.IPV4_REGEX),
        ],
      ],
      port: [
        undefined as number | undefined,
        [
          Validators.required,
          Validators.min(Database.MIN_PORT),
          Validators.max(Database.MAX_PORT),
          Validators.pattern(Database.INTEGER_REGEX),
        ],
      ],
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
          Validators.minLength(Database.MIN_URL_LENGTH),
          Validators.maxLength(Database.MAX_URL_LENGTH),
          Validators.pattern(Database.URL_REGEX),
        ],
      ],
      validDaysLeft: [
        undefined as number | undefined,
        [
          Validators.min(Database.MIN_VALID_DAYS_LEFT),
          Validators.max(Database.MAX_VALID_DAYS_LEFT),
          Validators.pattern(Database.INTEGER_REGEX),
        ],
      ],
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
  },
  {providedIn: 'scoped'},
);
