import {filter, pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {removeAllEntities, setAllEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';

import {BackendType, injectAPI} from '@app/api';
import {setError, setFulfilled, setPending, withRequestStatus} from '@app/services/store-features';

export const MonitorNotificationMethodsStore = signalStore(
  withRequestStatus(),
  withEntities<BackendType['NotificationMethodMinResponse']>(),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<string | undefined>(
      pipe(
        filter((it): it is string => !!it),
        tap(() => patchState(store, removeAllEntities(), setPending())),
        switchMap((id) =>
          api.get('/v1/monitor/{id}/notification-method', {params: {path: {id}}}).pipe(
            tapResponse({
              next: (it) => patchState(store, setFulfilled(), setAllEntities(it)),
              error: (error) => patchState(store, setError(error)),
            }),
          ),
        ),
      ),
    ),
    set: rxMethod<{
      id: string;
      ids: string[];
    }>(
      pipe(
        switchMap(({id, ids}) =>
          api.put('/v1/monitor/{id}/notification-method', {params: {path: {id}}, body: {ids}}),
        ),
      ),
    ),
  })),
);
