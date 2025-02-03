import {Location} from '@angular/common';
import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {injectAPI} from '@app/api';
import {MonitorDetailStore, MonitorsSearchStore, MonitorsStore} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const MonitorActionStore = signalStore(
  withRequestStatus(),
  withMethods(
    (
      store,
      api = injectAPI(),
      router = inject(Router),
      relativeTo = inject(ActivatedRoute),
      monitorsStore = inject(MonitorsStore),
      monitorsSearchStore = inject(MonitorsSearchStore, {optional: true}),
      monitorDetailStore = inject(MonitorDetailStore),
    ) => {
      const undelete = (id: string) =>
        api.delete('/v1/monitor/{id}/undo', {params: {path: {id}}}).pipe(
          tapResponse({
            next: (monitor) => {
              patchState(store, setFulfilled());

              monitorsStore.addMonitor(monitor);

              toast.success(`Successfully restored ${monitor.name}.`);

              void router.navigate(['t', monitor.team.id, 'm', monitor.id]);
            },
            error: (error) => patchState(store, setError(error)),
          }),
        );

      return {
        start: rxMethod<string>(
          pipe(
            tap(() => patchState(store, setPending())),
            switchMap((id) =>
              api
                .put('/v1/monitor/{id}/start', {
                  params: {
                    path: {
                      id,
                    },
                  },
                })
                .pipe(
                  tapResponse({
                    next: (monitor) => {
                      patchState(store, setFulfilled());

                      monitorsStore.updateMonitor(monitor);
                      monitorsSearchStore?.updateMonitor(monitor);
                      monitorDetailStore.updateMonitor(monitor);
                    },
                    error: (error) => patchState(store, setError(error)),
                  }),
                ),
            ),
          ),
        ),
        pause: rxMethod<string>(
          pipe(
            tap(() => patchState(store, setPending())),
            switchMap((id) =>
              api
                .put('/v1/monitor/{id}/pause', {
                  params: {
                    path: {
                      id,
                    },
                  },
                })
                .pipe(
                  tapResponse({
                    next: (monitor) => {
                      patchState(store, setFulfilled());

                      monitorsStore.updateMonitor(monitor);
                      monitorsSearchStore?.updateMonitor(monitor);
                      monitorDetailStore.updateMonitor(monitor);
                    },
                    error: (error) => patchState(store, setError(error)),
                  }),
                ),
            ),
          ),
        ),
        maintenance: rxMethod<string>(
          pipe(
            tap(() => patchState(store, setPending())),
            switchMap((id) =>
              api
                .put('/v1/monitor/{id}/maintenance', {
                  params: {
                    path: {
                      id,
                    },
                  },
                })
                .pipe(
                  tapResponse({
                    next: (monitor) => {
                      patchState(store, setFulfilled());

                      monitorsStore.updateMonitor(monitor);
                      monitorsSearchStore?.updateMonitor(monitor);
                      monitorDetailStore.updateMonitor(monitor);
                    },
                    error: (error) => patchState(store, setError(error)),
                  }),
                ),
            ),
          ),
        ),
        delete: rxMethod<string>(
          pipe(
            tap(() => patchState(store, setPending())),
            switchMap((id) =>
              api.delete('/v1/monitor/{id}', {params: {path: {id}}}).pipe(
                tapResponse({
                  next: () => {
                    patchState(store, setFulfilled());

                    router.navigate(['..'], {relativeTo}).then(() => {
                      monitorsStore.removeMonitor(id);
                      monitorsSearchStore?.removeMonitor(id);

                      toast.success('Successfully deleted monitor.', {
                        action: {
                          label: 'Undo',
                          onClick: () => undelete(id).subscribe(),
                        },
                      });
                    });
                  },
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
            ),
          ),
        ),
      };
    },
  ),
);
