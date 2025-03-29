import {inject} from '@angular/core';
import {Router} from '@angular/router';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';

import {setError, setFulfilled, setPending, withRequestStatus} from '../store-features';
import {
  InfiniteMonitorsStore,
  MonitorDetailStore,
  MonitorNotificationMethodsStore,
  MonitorsSearchStore,
} from './';

export const MonitorEditStore = signalStore(
  withRequestStatus(),
  withState<{
    monitor: BackendType['MonitorMaxResponse'] | undefined;
  }>({
    monitor: undefined,
  }),
  withMethods(
    (
      store,
      router = inject(Router),
      api = injectAPI(),
      monitorDetailStore = inject(MonitorDetailStore),
      monitorsStore = inject(InfiniteMonitorsStore),
      monitorsSearchStore = inject(MonitorsSearchStore, {optional: true}),
      monitorNotificationMethodsStore = inject(MonitorNotificationMethodsStore),
    ) => ({
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
      create: rxMethod<
        BackendType['CreateMonitorDto'] & BackendType['SetMonitorNotificationMethodsDto']
      >(
        switchMap((body) =>
          api.post('/v1/monitor', {body}).pipe(
            tapResponse({
              next: (monitor) => {
                monitorDetailStore.updateMonitor(monitor);
                monitorsStore.addMonitor(monitor);

                monitorNotificationMethodsStore.set({
                  id: monitor.id,
                  ids: body.ids,
                });

                void router.navigate(['/', 't', monitor.team.id, 'm', monitor.id, 'edit']);
              },
              error: () => {},
            }),
          ),
        ),
      ),
      update: rxMethod<
        BackendType['UpdateMonitorDto'] & BackendType['SetMonitorNotificationMethodsDto']
      >(
        switchMap((body) =>
          api.put('/v1/monitor', {body}).pipe(
            tapResponse({
              next: (monitor) => {
                monitorDetailStore.updateMonitor(monitor);
                monitorsStore.updateMonitor(monitor);
                monitorsSearchStore?.updateMonitor(monitor);

                monitorNotificationMethodsStore.set({
                  id: monitor.id,
                  ids: body.ids,
                });

                void router.navigate(['/', 't', monitor.team.id, 'm', monitor.id], {
                  queryParamsHandling: 'merge',
                });
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    }),
  ),
);
