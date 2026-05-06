import {BackendType} from '@app/api';

export type MaintenanceVisibility = 'INTERNAL' | 'PUBLIC';
export type MaintenanceAlertBehavior = 'SUPPRESS' | 'DOWNGRADE' | 'ALLOW';
export type MaintenanceState = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export interface MaintenanceResponse {
  id: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  visibility: MaintenanceVisibility;
  alertBehavior: MaintenanceAlertBehavior;
  notifyScheduled: boolean;
  notifyStarted: boolean;
  notifyEnded: boolean;
  reminderOffsetsMinutes: number[];
  startedAt?: string | null;
  endedAt?: string | null;
  deleted?: string | null;
  monitors: BackendType['MonitorMinResponse'][];
}

export interface MaintenancePayload {
  teamId?: string;
  id?: string;
  title: string;
  description?: string | null;
  startsAt?: string | null;
  endsAt: string;
  timeZone: string;
  visibility: MaintenanceVisibility;
  alertBehavior: MaintenanceAlertBehavior;
  monitorIds: string[];
  startNow?: boolean;
  notifyScheduled: boolean;
  notifyStarted: boolean;
  notifyEnded: boolean;
  reminderOffsetsMinutes: number[];
}

export interface PaginatedMaintenanceResponse {
  numberOfItems: number;
  numberOfPages: number;
  data: MaintenanceResponse[];
}
