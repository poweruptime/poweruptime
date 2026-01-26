import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {injectAPI} from '@app/api';
import {injectConfirmDialog$} from '@app/components';
import {InfiniteMonitorsStore, MonitorDetailStore, MonitorsSearchStore} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const MonitorActionStore = signalStore(
  withRequestStatus(),
  withMethods(
    (
      store,
      api = injectAPI(),
      router = inject(Router),
      relativeTo = inject(ActivatedRoute),
      confirmDialog$ = injectConfirmDialog$(),
      monitorsStore = inject(InfiniteMonitorsStore),
      monitorsSearchStore = inject(MonitorsSearchStore, {optional: true}),
      monitorDetailStore = inject(MonitorDetailStore, {optional: true}),
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
                      monitorDetailStore?.updateMonitor(monitor);
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
                      monitorDetailStore?.updateMonitor(monitor);
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
                      monitorDetailStore?.updateMonitor(monitor);
                    },
                    error: (error) => patchState(store, setError(error)),
                  }),
                ),
            ),
          ),
        ),
        delete: rxMethod<string>(
          switchMap((id) =>
            confirmDialog$(translate('general.confirmDelete')).pipe(
              tap(() => patchState(store, setPending())),
              switchMap(() =>
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
        ),
        clone: rxMethod<{id: string; teamId?: string}>(
          switchMap(({id, teamId}) =>
            api.put('/v1/monitor/{id}/clone', {params: {path: {id}}, body: {teamId}}).pipe(
              tapResponse({
                next: (it) => {
                  patchState(store, setFulfilled());
                  if (!teamId) {
                    monitorsStore.addMonitor(it);
                  }

                  toast.success(translate('monitor.cloneSuccess'));
                },
                error: (error) => patchState(store, setError(error)),
              }),
            ),
          ),
        ),
      };
    },
  ),
);
