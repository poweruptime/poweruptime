import {pipe, switchMap, tap} from 'rxjs';

import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {removeAllEntities, removeEntity, setEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from 'ngx-sonner';

import {BackendType, injectAPI} from '@app/api';
import {
  PaginationDto,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
} from '@app/services/store-features';

export const SessionsStore = signalStore(
  withPaginatedTable<BackendType['SessionResponse']>({
    columnsToDisplay: ['description', 'updatedAt', 'createdAt', 'actions'],
    defaultSortBy: 'updatedAt',
    defaultSortDirection: 'desc',
  }),
  withMethods((store, api = injectAPI()) => ({
    load: rxMethod<{userId: string | undefined} & PaginationDto>(
      pipe(
        tap(() => patchState(store, setPending())),
        switchMap(({userId, ...query}) =>
          (userId
            ? api.get('/v1/user/session', {
                params: {
                  query: {
                    userId,
                    ...query,
                  },
                },
              })
            : api.get('/v1/profile/sessions', {params: {query}})
          ).pipe(
            tapResponse({
              next: (response) =>
                patchState(
                  store,
                  removeAllEntities(),
                  setEntities(response.data),
                  setTotalElements(response.numberOfItems),
                  setFulfilled(),
                ),
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
          api
            .delete('/v1/profile/sessions/{id}', {
              params: {
                path: {
                  id,
                },
              },
            })
            .pipe(
              tapResponse({
                next: () => {
                  patchState(store, setFulfilled(), removeEntity(id));

                  toast.success(`Successfully removed session`);
                },
                error: (error) => {
                  patchState(store, setError(error), setFulfilled());

                  toast.error(`Could not remove session`);
                },
              }),
            ),
        ),
      ),
    ),
  })),
);
