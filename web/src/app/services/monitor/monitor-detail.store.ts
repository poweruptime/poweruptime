import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withComputed, withHooks, withMethods} from '@ngrx/signals';
import {
  SelectEntityId,
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {PushService, withMonitorLoad} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {mapUptime} from '../util';

export const MonitorDetailStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withMonitorLoad(),
  withComputed(({monitor}) => ({
    uptimeResults: computed(() => (monitor() ? mapUptime(monitor()!.uptime) : [])),
  })),
  withMethods((store, api = injectAPI()) => ({
    updateMonitor(monitor: BackendType['MonitorMaxResponse']) {
      if (store.monitor()?.id === monitor.id) {
        patchState(store, () => ({monitor}));
      }
    },
  })),
  withHooks({
    onInit(store, pushService = inject(PushService)) {
      pushService.monitorStatusChange$
        .pipe(takeUntilDestroyed())
        .subscribe((it) => store.updateMonitor(it));
    },
  }),
);

const selectId: SelectEntityId<BackendType['DayUptimeStatistics']> = (it) => it.name;

export const MonitorDetailsYearlyUptimeStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withEntities<BackendType['DayUptimeStatistics']>(),
  withMethods((store, api = injectAPI()) => ({
    loadByMonitorId: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        tap(() => patchState(store, setPending(), removeAllEntities())),
        switchMap((id) =>
          api.get('/v1/public/monitor/{id}/yearly', {params: {path: {id}}}).pipe(
            tapResponse({
              next: (data) => {
                patchState(store, setAllEntities(data, {selectId}), setFulfilled());
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
  })),
);
