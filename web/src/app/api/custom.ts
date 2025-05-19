import type {components, operations} from './api-types';

export type BackendType = components['schemas'];
export type BackendOperation = operations;

export type MonitorDataType = BackendType['MonitorData']['_type'];

export const MONITOR_CHECKER_DATA_TYPES = [
  {
    label: 'monitor.checker.DNS',
    value: 'DNS',
  },
  {
    label: 'monitor.checker.HTTP',
    value: 'HTTP',
  },
  {
    label: 'monitor.checker.PING',
    value: 'PING',
  },
  {
    label: 'monitor.checker.PUSH',
    value: 'PUSH',
  },
  {
    label: 'monitor.checker.SSL_CERTIFICATE',
    value: 'SSL_CERTIFICATE',
  },
] satisfies {value: MonitorDataType; label: string}[];

export const NOTIFICATION_METHOD_SENDER_DATA_TYPES = [
  {
    label: 'notificationMethod.sender.DISCORD',
    value: 'DISCORD',
  },
  {
    label: 'notificationMethod.sender.EMAIL',
    value: 'EMAIL',
  },
  {
    label: 'notificationMethod.sender.SLACK',
    value: 'SLACK',
  },
] satisfies {value: BackendType['NotificationMethodData']['_type']; label: string}[];

export type HttpMonitorDataMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';
export type HttpMonitorDataContentType = 'JSON' | 'XML';

export type DnsMonitorDataType =
  | 'A'
  | 'AAAA'
  | 'CAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'PTR'
  | 'SOA'
  | 'SRV'
  | 'TXT';

export type PushDto = {
  type: 'CHECK_RESULT' | 'MONITOR' | 'NOTIFICATION';
};

export class Database {
  static readonly MIN_NAME_LENGTH: number = 2;
  static readonly MAX_NAME_LENGTH: number = 70;
  static readonly MIN_MAIL_LENGTH: number = 5;
  static readonly MAX_MAIL_LENGTH: number = 255;

  static readonly MIN_TEST_INTERVAL_SECONDS: number = 30; // 30 seconds
  static readonly MAX_TEST_INTERVAL_SECONDS: number = 94608000; // 3 years

  static readonly MAX_SESSION_DESCRIPTION_LENGTH: number = 60;
  static readonly MAX_REFRESH_TOKEN_LENGTH: number = 1020;
  static readonly MAX_PASSWORD_RESET_TOKEN_LENGTH: number = 20;
  static readonly MAX_TEAM_JOIN_TOKEN_LENGTH: number = 20;

  static readonly MIN_PASSWORD_LENGTH = 6;

  static readonly MIN_SLUG_LENGTH: number = 1;
  static readonly MAX_SLUG_LENGTH: number = 255;

  static readonly SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  static readonly MIN_URL_LENGTH: number = 1;
  static readonly MAX_URL_LENGTH: number = 2048;

  static readonly MAX_BASIC_AUTH_LENGTH: number = 512;

  static readonly MIN_VALID_DAYS_LEFT: number = 1;
  static readonly MAX_VALID_DAYS_LEFT: number = 3650; // 4 years

  static readonly MIN_REDIRECTS = 1;
  static readonly MAX_REDIRECTS = 20;

  static readonly MAX_TITLE_LENGTH: number = 2000;
  static readonly MAX_MESSAGE_LENGTH: number = 4000;

  static readonly MIN_DISPLAY_NAME_LENGTH: number = 1;
  static readonly MAX_DISPLAY_NAME_LENGTH: number = 32;

  static readonly URL_REGEX =
    /^(https?|ftp|file):\/\/[-a-zA-Z0-9+&@#/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#/%=~_|]/;

  static readonly MIN_STATUS_CODES = 1;
  static readonly STATUS_CODE_REGEX = /^\d{3}\s*-\s*\d{3}$/;

  static readonly DOMAIN_REGEX =
    /(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]/;
  static readonly MIN_DOMAIN_LENGTH: number = 1;
  static readonly MAX_DOMAIN_LENGTH: number = 253;

  static readonly MIN_IPV4_LENGTH: number = 1;
  static readonly MAX_IPV4_LENGTH: number = 15;
  static readonly IPV4_REGEX = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;

  static readonly MIN_PORT: number = 1;
  static readonly MAX_PORT: number = 65535;

  static readonly INTEGER_REGEX = /^[0-9]*$/;
}
