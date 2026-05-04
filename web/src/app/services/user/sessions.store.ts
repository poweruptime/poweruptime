import {forkJoin, map, pipe, switchMap, tap} from 'rxjs';

import {translate} from '@jsverse/transloco';
import {tapResponse} from '@ngrx/operators';
import {patchState, signalStore, withMethods} from '@ngrx/signals';
import {removeAllEntities, removeEntities, setEntities, withEntities} from '@ngrx/signals/entities';
import {rxMethod} from '@ngrx/signals/rxjs-interop';
import {toast} from '@spartan-ng/brain/sonner';

import {BackendType, injectAPI} from '@app/api';
import {
  PaginationDto,
  resetSelection,
  setError,
  setFulfilled,
  setPending,
  setTotalElements,
  withPaginatedTable,
  withRequestStatus,
  withSelection,
} from '@app/services/store-features';

import {injectConfirmDialog$} from '../../components';

export const SessionsStore = signalStore(
  withRequestStatus(),
  withEntities<BackendType['SessionResponse']>(),
  withPaginatedTable<BackendType['SessionResponse']>({
    columnsToDisplay: ['select', 'description', 'updatedAt', 'createdAt'],
    defaultSortBy: 'updatedAt',
    defaultSortDirection: 'desc',
  }),
  withSelection<BackendType['SessionResponse']>({}),
  withMethods((store, api = injectAPI(), confirmDialog$ = injectConfirmDialog$()) => ({
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
    deleteSelection: rxMethod<void>(
      switchMap(() =>
        confirmDialog$(translate('general.confirmDelete')).pipe(
          tap(() => patchState(store, setPending())),
          map(() => store.selection().map((it) => it.id)),
          switchMap((ids) =>
            forkJoin(
              ids.map((id) => api.delete('/v1/profile/sessions/{id}', {params: {path: {id}}})),
            ).pipe(
              tapResponse({
                next: () => {
                  toast.success(`Successfully removed session(s)`);

                  patchState(store, setFulfilled(), removeEntities(ids), resetSelection());
                },
                error: (error) => {
                  toast.error(`Could not remove session(s)`);
                  patchState(store, setError(error), setFulfilled());
                },
              }),
            ),
          ),
        ),
      ),
    ),
  })),
);
