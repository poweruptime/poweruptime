import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const SubNotificationsStore = signalStore(
  {providedIn: 'root'},
  withState<{
    notificationId: string | undefined;
  }>({
    notificationId: undefined,
  }),
  withRequestStatus(),
  withEntities<BackendType['SubNotificationResponse']>(),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        tap((notificationId) =>
          patchState(store, setPending(), removeAllEntities(), {notificationId}),
        ),
        switchMap((notificationId) =>
          api
            .get('/v1/sub-notification', {
              params: {
                query: {
                  notificationId,
                  page: 0,
                  size: 100,
                  sort: ['createdAt_asc'],
                },
              },
            })
            .pipe(
              tapResponse({
                next: (response) =>
                  patchState(store, setAllEntities(response.data), setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
  // withHooks({
  //   onInit(store, pushService = inject(PushService)) {
  //     pushService.notifications$
  //       .pipe(takeUntilDestroyed())
  //       .subscribe((it) => store.addNotification(it));
  //   },
  // }),
);
