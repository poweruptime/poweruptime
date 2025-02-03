import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

import {NotificationMethodsStore} from './notification-methods.store';

export const NotificationMethodEditStore = signalStore(
  withRequestStatus(),
  withState<{notificationMethod: BackendType['NotificationMethodResponse'] | undefined}>({
    notificationMethod: undefined,
  }),
  withMethods(
    (
      store,
      router = inject(Router),
      relativeTo = inject(ActivatedRoute),
      api = injectAPI(),
      notificationMethodsStore = inject(NotificationMethodsStore),
    ) => {
      const undelete = (id: string) =>
        api.delete('/v1/notification-method/{id}/undo', {params: {path: {id}}}).pipe(
          tapResponse({
            next: (notificationMethod) => {
              patchState(store, setFulfilled());

              notificationMethodsStore.addNotificationMethod(notificationMethod);

              toast.success(`Successfully restored ${notificationMethod.name}.`);
            },
            error: (error) => patchState(store, setError(error)),
          }),
        );

      return {
        loadById: rxMethod<string | undefined>(
          pipe(
            filter((it): it is string => !!it),
            distinctUntilChanged(),
            tap(() => patchState(store, setPending(), () => ({notificationMethod: undefined}))),
            switchMap((id) =>
              api
                .get('/v1/notification-method/{id}', {
                  params: {
                    path: {
                      id,
                    },
                  },
                })
                .pipe(
                  tapResponse({
                    next: (notificationMethod) =>
                      patchState(store, () => ({notificationMethod}), setFulfilled()),
                    error: (error) => patchState(store, setError(error)),
                  }),
                ),
            ),
          ),
        ),
        create: rxMethod<BackendType['CreateNotificationMethodDto']>(
          switchMap((body) =>
            api.post('/v1/notification-method', {body}).pipe(
              tapResponse({
                next: () => {
                  // notificationMethodsStore.updateNotificationMethod(notificationMethod);

                  void router.navigate(['../'], {
                    relativeTo,
                  });
                },
                error: () => {},
              }),
            ),
          ),
        ),
        update: rxMethod<BackendType['UpdateNotificationMethodDto']>(
          switchMap((body) =>
            api.put('/v1/notification-method', {body}).pipe(
              tapResponse({
                next: () => {
                  // notificationMethodsStore.updateNotificationMethod(notificationMethod);

                  void router.navigate(['../'], {
                    relativeTo,
                    queryParamsHandling: 'merge',
                  });
                },
                error: (error) => {},
              }),
            ),
          ),
        ),
        delete: rxMethod<string>(
          pipe(
            tap(() => patchState(store, setPending())),
            switchMap((id) =>
              api.delete('/v1/notification-method/{id}', {params: {path: {id}}}).pipe(
                tapResponse({
                  next: () => {
                    patchState(store, setFulfilled());

                    notificationMethodsStore.removeNotificationMethod(id);

                    toast.success('Successfully deleted notification method.', {
                      action: {
                        label: 'Undo',
                        onClick: () => undelete(id).subscribe(),
                      },
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
