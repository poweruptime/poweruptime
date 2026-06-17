import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

type TimezoneInfo = BackendType['TimezoneInfo'];

interface TimezoneWithLabel extends TimezoneInfo {
  label: string;
}

export interface GroupedTimezones {
  region: string;
  timezones: TimezoneWithLabel[];
}

export const InstanceAvailableTimezonesStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    availableTimezones: GroupedTimezones[] | undefined;
  }>({
    availableTimezones: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(() =>
          api.get('/v1/instance-settings/timezones').pipe(
            tapResponse({
              next: (dto) =>
                patchState(
                  store,
                  {availableTimezones: groupTimezonesByRegion(dto.availableTimezones)},
                  setFulfilled(),
                ),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);

function groupTimezonesByRegion(timezones: TimezoneInfo[]): GroupedTimezones[] {
  const grouped = new Map<string, TimezoneWithLabel[]>();

  for (const tz of timezones) {
    const region = extractRegion(tz.id);
    const label = createLabel(tz.id);
    const tzWithLabel = {
      ...tz,
      label,
    };

    if (!grouped.has(region)) {
      grouped.set(region, []);
    }
    grouped.get(region)!.push(tzWithLabel);
  }

  return Array.from(grouped.entries())
    .map(([region, timezones]) => ({
      region,
      timezones: timezones.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.region.localeCompare(b.region));
}

function extractRegion(tzId: string): string {
  const region = tzId.split('/')[0];
  return region || 'Other';
}

function createLabel(tzId: string): string {
  const parts = tzId.split('/');
  if (parts.length === 1) return tzId;

  return parts[parts.length - 1].replace(/_/g, ' ');
}
