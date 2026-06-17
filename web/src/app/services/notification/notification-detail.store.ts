import {distinctUntilChanged, filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods, withState} from '@ngrx/signals';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const NotificationDetailStore = signalStore(
  {providedIn: 'root'},
  withRequestStatus(),
  withState<{
    notification: BackendType['NotificationResponse'] | undefined;
  }>({
    notification: undefined,
  }),
  withMethods((store, api = injectAPI()) => ({
    loadById: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        distinctUntilChanged(),
        tap(() => patchState(store, setPending(), {notification: undefined})),
        switchMap((id) =>
          api
            .get('/v1/notification/{id}', {
              params: {
                path: {
                  id,
                },
              },
            })
            .pipe(
              tapResponse({
                next: (notification) => patchState(store, {notification}, setFulfilled()),
                error: (error) => patchState(store, setError(error)),
              }),
            ),
        ),
      ),
    ),
  })),
);
