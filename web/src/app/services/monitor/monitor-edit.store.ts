import {inject} from '@angular/core';
import {Router} from '@angular/router';

import {switchMap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';

import {setError, withRequestStatus} from '../store-features';
import {InfiniteMonitorsStore, MonitorDetailStore, MonitorsSearchStore, withMonitorLoad} from './';

export const MonitorEditStore = signalStore(
  withRequestStatus(),
  withMonitorLoad(),
  withMethods(
    (
      store,
      router = inject(Router),
      api = injectAPI(),
      monitorDetailStore = inject(MonitorDetailStore),
      monitorsStore = inject(InfiniteMonitorsStore),
      monitorsSearchStore = inject(MonitorsSearchStore, {optional: true}),
    ) => ({
      create: rxMethod<BackendType['CreateMonitorDto']>(
        switchMap((body) =>
          api.post('/v1/monitor', {body}).pipe(
            tapResponse({
              next: (monitor) => {
                monitorDetailStore.updateMonitor(monitor);
                monitorsStore.addMonitor(monitor);

                void router.navigate(['/', 't', monitor.team.id, 'm', monitor.id, 'edit']);
              },
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
      update: rxMethod<BackendType['UpdateMonitorDto']>(
        switchMap((body) =>
          api.put('/v1/monitor', {body}).pipe(
            tapResponse({
              next: (monitor) => {
                monitorDetailStore.updateMonitor(monitor);
                monitorsStore.updateMonitor(monitor);
                monitorsSearchStore?.updateMonitor(monitor);

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
