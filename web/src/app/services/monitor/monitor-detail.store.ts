import {computed, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  SelectEntityId,
  removeAllEntities,
  setAllEntities,
  withEntities,
} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {MonitorNtfyService} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {mapUptime} from '../util';

export const MonitorDetailStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    monitor: BackendType['MonitorMaxResponse'] | undefined;
  }>({
    monitor: undefined,
  }),
  withComputed(({monitor}) => ({
    uptimeResults: computed(() => (monitor() ? mapUptime(monitor()!.uptime) : [])),
  })),
  withMethods((store, api = injectAPI()) => ({
    updateMonitor(monitor: BackendType['MonitorMaxResponse']) {
      if (store.monitor()?.id === monitor.id) {
        patchState(store, () => ({monitor}));
      }
    },
    loadMonitorById: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        distinctUntilChanged(),
        tap(() => patchState(store, setPending(), () => ({monitor: undefined}))),
        switchMap((id) =>
          api
            .get('/v1/monitor/{id}', {
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
  withHooks({
    onInit(store, monitorNtfyService = inject(MonitorNtfyService)) {
      monitorNtfyService.monitorStatusChange$
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
