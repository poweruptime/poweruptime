import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {StatusPagesStore} from '@app/services';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const StatusPageEditStore = signalStore(
  withRequestStatus(),
  withState<{statusPage: BackendType['StatusPageResponse'] | undefined}>({
    statusPage: undefined,
  }),
  withMethods(
    (
      store,
      router = inject(Router),
      relativeTo = inject(ActivatedRoute),
      api = injectAPI(),
      statusPagesStore = inject(StatusPagesStore),
    ) => ({
      loadById: rxMethod<string | undefined>(
        pipe(
          filter((it): it is string => !!it),
          distinctUntilChanged(),
          tap(() => patchState(store, setPending(), () => ({statusPage: undefined}))),
          switchMap((id) =>
            api
              .get('/v1/status-page/{id}', {
                params: {
                  path: {
                    id,
                  },
                },
              })
              .pipe(
                tapResponse({
                  next: (statusPage) => patchState(store, () => ({statusPage}), setFulfilled()),
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
          ),
        ),
      ),
      create: rxMethod<BackendType['CreateStatusPageDto']>(
        switchMap((body) =>
          api.post('/v1/status-page', {body}).pipe(
            tapResponse({
              next: (statusPage) => {
                // notificationMethodsStore.updateNotificationMethod(notificationMethod);

                void router.navigate(['../', statusPage.id], {
                  relativeTo,
                });
              },
              error: () => {},
            }),
          ),
        ),
      ),
      update: rxMethod<BackendType['UpdateStatusPageDto']>(
        switchMap((body) =>
          api.put('/v1/status-page', {body}).pipe(
            tapResponse({
              next: (statusPage) => patchState(store, () => ({statusPage})),
              error: () => {},
            }),
          ),
        ),
      ),
    }),
  ),
);
