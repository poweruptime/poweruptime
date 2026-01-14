import {computed} from '@angular/core';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';

import {setError, setFulfilled, setPending, withRequestStatus} from '../store-features';
import {buildPingStatistics, buildUptimeStatistics, calculatePingChart} from '../util';

export const PublicMonitorDetailStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    monitor: BackendType['PublicMonitorResponse'] | undefined;
  }>({
    monitor: undefined,
  }),
  withComputed(({monitor}) => ({
    uptimeStatistics: computed(() => buildUptimeStatistics(monitor()?.statistics?.uptime)),
    pingStatistics: computed(() => buildPingStatistics(monitor()?.statistics?.ping)),
    pingChart: computed(() => calculatePingChart(monitor() ? monitor()!.lastCheckResults : [])),
  })),
  withMethods((store, api = injectAPI()) => ({
    loadMonitorById: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        tap(() => patchState(store, setPending(), () => ({monitor: undefined}))),
        switchMap((id) =>
          api
            .get('/v1/public/monitor/{id}', {
              params: {
                path: {
                  id,
                },
              },
            })
            .pipe(
              tapResponse({
                next: (monitor) => patchState(store, () => ({monitor}), setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);
