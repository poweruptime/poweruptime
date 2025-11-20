import {inject} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';

import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const NotificationMethodEditStore = signalStore(
  withRequestStatus(),
  withState<{
    notificationMethod: BackendType['NotificationMethodResponse'] | undefined;
    template: BackendType['NotificationMethodTemplateResponse'] | undefined;
  }>({
    notificationMethod: undefined,
    template: undefined,
  }),
  withMethods(
    (store, router = inject(Router), relativeTo = inject(ActivatedRoute), api = injectAPI()) => ({
      loadById: rxMethod<string | undefined>(
        pipe(
          filter((it): it is string => !!it),
          distinctUntilChanged(),
          tap(() =>
            patchState(store, setPending(), () => ({
              notificationMethod: undefined,
              template: undefined,
            })),
          ),
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
                  next: (notificationMethod) => patchState(store, () => ({notificationMethod})),
                  error: (error) => patchState(store, setError(error)),
                }),
              ),
          ),
          switchMap(({data}) =>
            api
              .get('/v1/notification-method/template/{type}', {
                params: {
                  path: {
                    type: data._type,
                  },
                },
              })
              .pipe(
                tapResponse({
                  next: (template) => patchState(store, () => ({template}), setFulfilled()),
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
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    }),
  ),
);
